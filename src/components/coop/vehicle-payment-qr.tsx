import { useState } from "react";
import { Text, View } from "react-native";

import { PaymentQrScanner } from "@/components/payment-qr-scanner";
import { PaymentQrView } from "@/components/payment-qr-view";
import { Button } from "@/components/ui/button";

type Mode = "idle" | "scan" | "show";

// A vehicle's payment QR as the coop sees it: who set it, show it, scan the coop's own, replace or remove.
export function VehiclePaymentQr({
  qr,
  byDriver,
  onSave,
}: {
  qr: string | null;
  byDriver: boolean;
  onSave: (qr: string | null) => Promise<void>; // the parent catches failures and shows the error
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [busy, setBusy] = useState(false);

  async function save(next: string | null) {
    setMode("idle");
    setBusy(true);
    try {
      await onSave(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-3">
      <Text className="font-medium text-foreground">Payment QR</Text>
      {mode === "scan" ? (
        <PaymentQrScanner onScanned={save} onCancel={() => setMode("idle")} />
      ) : mode === "show" && qr ? (
        <View className="gap-3">
          <PaymentQrView qr={qr} />
          <Button label="Close" variant="outline" onPress={() => setMode("idle")} />
        </View>
      ) : qr ? (
        <View className="gap-2">
          <Text className="text-muted">{byDriver ? "Set by driver" : "Set by coop"}</Text>
          <Button label="Show QR" disabled={busy} onPress={() => setMode("show")} />
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
        <Button
          label="Scan coop payment QR"
          loading={busy}
          loadingLabel="Saving..."
          onPress={() => setMode("scan")}
        />
      )}
    </View>
  );
}
