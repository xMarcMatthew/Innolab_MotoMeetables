import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import { Linking, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { boardVehicle } from "@/lib/api/boarding";
import type { LatLng } from "@/lib/api/commuter";

type State =
  | { mode: "idle" }
  | { mode: "scan" }
  | { mode: "boarding" }
  | { mode: "boarded"; plate: string | null }
  | { mode: "error"; message: string };

// Scan the QR on the driver's QR tab. board_vehicle only accepts a commuter within 100 m of the vehicle,
// so this takes a fresh, precise fix (getMyLocation accepts one up to 5 min old). The QR text is not
// checked here: the server answers "This is not a Larga boarding code" for anything else.
export function ScanToBoard({ destination, place }: { destination: LatLng; place: string }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>({ mode: "idle" });
  const fix = useRef<Promise<Location.LocationObject> | null>(null);
  const scanned = useRef(false); // the camera reports the same QR many times a second

  async function start() {
    const location = await Location.requestForegroundPermissionsAsync();
    if (!location.granted) {
      return setState({
        mode: "error",
        message: "Larga needs your location to check you are at the vehicle. It is never saved.",
      });
    }
    // Start the GPS fix with the camera, so it is ready when the QR is read.
    // shortcut: no timeout, so a weak indoor signal can leave "Checking" spinning; add one if testers hit it.
    fix.current = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    fix.current.catch(() => {}); // awaited after the scan; this only silences the unhandled warning
    scanned.current = false;
    setState({ mode: "scan" });
  }

  async function onScanned(token: string) {
    if (scanned.current) return;
    scanned.current = true;
    setState({ mode: "boarding" });
    try {
      const { coords } = await fix.current!;
      const plate = await boardVehicle(
        token,
        { lat: coords.latitude, lng: coords.longitude },
        destination,
      );
      setState({ mode: "boarded", plate });
    } catch (e) {
      setState({ mode: "error", message: (e as Error).message });
    }
  }

  if (state.mode === "scan") {
    if (!permission) return null;
    if (!permission.granted) {
      const blocked = !permission.canAskAgain;
      return (
        <View className="gap-3">
          <Text className="text-foreground">
            Larga needs the camera to scan the driver&apos;s QR.
          </Text>
          <Button
            label={blocked ? "Open settings" : "Allow camera"}
            onPress={blocked ? () => Linking.openSettings() : requestPermission}
          />
          <Button label="Cancel" variant="link" onPress={() => setState({ mode: "idle" })} />
        </View>
      );
    }
    return (
      <View className="gap-3">
        <View className="h-80 overflow-hidden rounded-lg">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onScanned(data)}
          />
        </View>
        <Text className="text-muted">Point the camera at the QR on the driver&apos;s phone.</Text>
        <Button label="Cancel" variant="link" onPress={() => setState({ mode: "idle" })} />
      </View>
    );
  }

  if (state.mode === "boarded") {
    return (
      <View className="gap-2">
        <Text className="text-lg font-semibold text-foreground">
          Boarded {state.plate ?? "the vehicle"}
        </Text>
        <Text className="text-muted">Getting off near {place}</Text>
        <Button label="Done" variant="link" onPress={() => setState({ mode: "idle" })} />
      </View>
    );
  }

  return (
    <View className="gap-2">
      {state.mode === "error" && (
        <Text className="font-semibold text-destructive">{state.message}</Text>
      )}
      <Button
        label={state.mode === "error" ? "Try again" : "Scan to board"}
        variant="accent"
        loading={state.mode === "boarding"}
        loadingLabel="Checking you are at the vehicle"
        onPress={start}
      />
    </View>
  );
}
