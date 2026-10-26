import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { PaymentQrScanner } from "@/components/driver/payment-qr-scanner";

type Mode = "idle" | "scan" | "show";

// The driver's own QR Ph code: scan it once, then show it for commuters to scan with their wallet app.
// We never hold money and nothing confirms a payment.
export function PaymentQrSection({
  qr,
  fare,
  busy,
  onSave,
}: {
  qr: string | null;
  fare: number | null; // the driver's fare, else the guide fare
  busy: boolean;
  onSave: (qr: string | null) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("idle");

  async function save(next: string | null) {
    setMode("idle");
    await onSave(next);
  }

  const button = "items-center rounded-lg py-3";

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-foreground">Payment QR</Text>

      {mode === "scan" ? (
        <PaymentQrScanner onScanned={save} onCancel={() => setMode("idle")} />
      ) : mode === "show" && qr ? (
        <View className="gap-3">
          {/* Black on white so wallet apps can scan it. */}
          <View className="items-center rounded-lg border border-border bg-white p-4">
            <QRCode value={qr} size={280} color="black" backgroundColor="white" />
          </View>
          <Text className="text-muted">
            Scan with GCash, Maya or your bank app. Enter{" "}
            {fare !== null ? `₱${fare.toFixed(2)}` : "the fare"} yourself.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode("idle")}
            className={`${button} border border-muted bg-white`}
          >
            <Text className="font-semibold text-foreground">Close</Text>
          </Pressable>
        </View>
      ) : qr ? (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => setMode("show")}
            className={`${button} bg-primary`}
          >
            <Text className="font-semibold text-white">Show payment QR</Text>
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => setMode("scan")}
              className={`${button} flex-1 border border-muted bg-white`}
            >
              <Text className="font-semibold text-foreground">Replace</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => save(null)}
              className={`${button} flex-1 border border-muted bg-white`}
            >
              <Text className="font-semibold text-destructive">Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => setMode("scan")}
          className={`${button} bg-primary`}
        >
          <Text className="font-semibold text-white">Scan my payment QR</Text>
        </Pressable>
      )}
    </View>
  );
}
