import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";

import { setStatus } from "@/lib/api/driver";
import { supabase } from "@/lib/supabase";

const TRIP_TASK = "larga-trip-location";
const DROP_OFF_CHANNEL = "drop-offs";

// By default a notification arriving while Larga is on screen is silent; drop-off alerts must always sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// A local notification from this phone (no push server). Permission comes from the first-trip checklist;
// without it the trip still runs, only silently.
function alertDropOff(count: number) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Drop-off ahead",
      // 200 m is the distance update_my_location checks (migration 9).
      body: `${count} passenger${count > 1 ? "s" : ""} getting off in about 200 m.`,
      sound: true,
    },
    trigger: { channelId: DROP_OFF_CHANNEL },
  });
}

// Must run at import time (root layout imports this file) so Android can wake it with the app in the background.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  TRIP_TASK,
  async ({ data, error }) => {
    const fix = data?.locations.at(-1);
    if (error || !fix) return;
    // A failed send is not retried: the next fix comes about 5 s later anyway.
    const { data: alerts, error: rpcError } = await supabase.rpc("update_my_location", {
      p_lat: fix.coords.latitude,
      p_lng: fix.coords.longitude,
    });
    if (!rpcError) {
      // Each drop point comes back once, the first time the vehicle is within 200 m of it.
      if ((alerts as number) > 0) {
        await alertDropOff(alerts as number).catch((e: Error) =>
          console.warn("drop-off alert failed:", e.message),
        );
      }
      return;
    }
    // 42501: the coop unassigned this vehicle (or the session is gone), so every later fix would fail too.
    if (rpcError.code === "42501") {
      if (await Location.hasStartedLocationUpdatesAsync(TRIP_TASK)) {
        await Location.stopLocationUpdatesAsync(TRIP_TASK);
      }
      return;
    }
    console.warn("update_my_location failed:", rpcError.message);
  },
);

export type StartTripResult = "started" | "location-denied" | "background-denied";

export async function startTrip(): Promise<StartTripResult> {
  if (!(await Location.requestForegroundPermissionsAsync()).granted) return "location-denied";
  // "Allow all the time": without it Android stops the updates once the screen turns off.
  if (!(await Location.requestBackgroundPermissionsAsync()).granted) return "background-denied";
  // High importance: Android shows the alert as a pop-up with sound, not only in the notification list.
  await Notifications.setNotificationChannelAsync(DROP_OFF_CHANNEL, {
    name: "Drop-off alerts",
    importance: Notifications.AndroidImportance.HIGH,
  });
  await Location.startLocationUpdatesAsync(TRIP_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: "Larga: on a trip",
      notificationBody: "Sharing your vehicle's location with riders.",
      killServiceOnDestroy: false,
    },
  });
  return "started";
}

export async function endTrip() {
  if (await Location.hasStartedLocationUpdatesAsync(TRIP_TASK)) {
    await Location.stopLocationUpdatesAsync(TRIP_TASK);
  }
  await setStatus("off_duty").catch((e: Error) => {
    throw new Error(`Location sharing stopped, but Off duty was not saved: ${e.message}`);
  });
}

export const isOnTrip = () => Location.hasStartedLocationUpdatesAsync(TRIP_TASK);
