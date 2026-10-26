import { useState } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { PaymentQrScanner } from "@/components/driver/payment-qr-scanner";
import { Button } from "@/components/ui/button";
import { useSavedFlash } from "@/hooks/use-saved-flash";

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
  onSave: (qr: string | null) => Promise<boolean>; // true when it saved
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [saved, flashSaved] = useSavedFlash();

  async function save(next: string | null) {
    setMode("idle");
    if (await onSave(next)) flashSaved();
  }

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
          <Button label="Close" variant="outline" onPress={() => setMode("idle")} />
        </View>
      ) : qr ? (
        <View className="gap-2">
          <Button label="Show payment QR" disabled={busy} onPress={() => setMode("show")} />
          <View className="flex-row gap-2">
            <Button
              label="Replace"
              variant="outline"
              disabled={busy}
              onPress={() => setMode("scan")}
              className="flex-1"
            />
            <Button
              label="Remove"
              variant="destructive-text"
              disabled={busy}
              onPress={() => save(null)}
              className="flex-1"
            />
          </View>
        </View>
      ) : (
        <Button label="Scan my payment QR" disabled={busy} onPress={() => setMode("scan")} />
      )}
      {saved && <Text className="font-semibold text-foreground">Saved ✓</Text>}
    </View>
  );
}
