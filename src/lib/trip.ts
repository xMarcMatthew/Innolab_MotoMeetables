import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { setStatus } from "@/lib/api/driver";
import { supabase } from "@/lib/supabase";

const TRIP_TASK = "larga-trip-location";

// Must run at import time (root layout imports this file) so Android can wake it with the app in the background.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  TRIP_TASK,
  async ({ data, error }) => {
    const fix = data?.locations.at(-1);
    if (error || !fix) return;
    // A failed send is not retried: the next fix comes about 5 s later anyway.
    const { error: rpcError } = await supabase.rpc("update_my_location", {
      p_lat: fix.coords.latitude,
      p_lng: fix.coords.longitude,
    });
    if (!rpcError) return;
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
