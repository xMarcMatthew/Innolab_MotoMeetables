import * as Location from "expo-location";
import { Alert } from "react-native";

import type { LatLng } from "@/lib/api/commuter";

let askedOnOpen = false; // Options asks once per app run, not on every search

// The one sentence shown before Android's own permission prompt.
function explain(): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      "Use your location?",
      "Larga uses it to put the terminal nearest you first. It is never saved.",
      [
        { text: "Not now", style: "cancel", onPress: () => resolve(false) },
        { text: "Continue", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

/** The commuter's location, or undefined when denied or off. fromTap: the user tapped Near me. */
export async function getMyLocation(fromTap = false): Promise<LatLng | undefined> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    let granted = permission.granted;
    if (!granted && permission.canAskAgain && (fromTap || !askedOnOpen)) {
      askedOnOpen = true;
      granted = (await explain()) && (await Location.requestForegroundPermissionsAsync()).granted;
    }
    if (!granted) return undefined;
    // Sorting terminals needs no precision, so a fix from the last few minutes is fine.
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return undefined; // location services off: every screen works without it
  }
}
