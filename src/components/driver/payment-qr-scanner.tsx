import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { isValidQrPh } from "@/lib/qrph";

// Scans one QR and passes it on only if it is a QR Ph payment code; anything else shows a message and
// keeps scanning. The camera permission is already in app.json.
export function PaymentQrScanner({
  onScanned,
  onCancel,
}: {
  onScanned: (qr: string) => void;
  onCancel: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [rejected, setRejected] = useState(false);
  const lastRejectedAt = useRef(0);
  const done = useRef(false);

  function onBarcode(text: string) {
    if (done.current) return;
    if (isValidQrPh(text)) {
      done.current = true;
      onScanned(text);
    } else if (Date.now() - lastRejectedAt.current > 1500) {
      lastRejectedAt.current = Date.now();
      setRejected(true);
    }
  }

  if (!permission) return null;

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <View className="gap-3">
        <Text className="text-foreground">Larga needs the camera to scan your payment QR.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={blocked ? () => Linking.openSettings() : requestPermission}
          className="items-center rounded-lg bg-primary py-3"
        >
          <Text className="font-semibold text-white">
            {blocked ? "Open settings" : "Allow camera"}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCancel} className="items-center py-2">
          <Text className="font-semibold text-primary">Cancel</Text>
        </Pressable>
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
          onBarcodeScanned={({ data }) => onBarcode(data)}
        />
      </View>
      <Text className="text-muted">Point the camera at your GCash, Maya or bank QR code.</Text>
      {rejected && (
        <Text className="font-semibold text-destructive">That isn&apos;t a QR Ph payment code</Text>
      )}
      <Pressable accessibilityRole="button" onPress={onCancel} className="items-center py-2">
        <Text className="font-semibold text-primary">Cancel</Text>
      </Pressable>
    </View>
  );
}
