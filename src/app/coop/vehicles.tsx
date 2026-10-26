import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text } from "react-native";

import { Chips, VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { PaymentQrScanner } from "@/components/payment-qr-scanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useMyVehicles } from "@/hooks/use-my-vehicles";
import { applyCoopPaymentQr, setVehicleStatusAsCoop, type VehicleStatus } from "@/lib/api/coop";
import { VEHICLE_STATUSES } from "@/lib/validation";

const STATUS_LABELS: Record<VehicleStatus, string> = {
  off_duty: "Off duty",
  loading: "Now loading",
  departed: "Departed",
};
const STATUS_OPTIONS = VEHICLE_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export default function Vehicles() {
  const router = useRouter();
  const { vehicles, loading, error, reload } = useMyVehicles();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [applied, setApplied] = useState<string | null>(null);

  // Coming back from the form must show the saved change.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function onStatus(id: string, status: VehicleStatus) {
    setBusyId(id);
    setActionError(null);
    try {
      await setVehicleStatusAsCoop(id, status);
      await reload();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  // The coop's QR goes to every vehicle except those whose QR a driver set; confirm with the counts first.
  function onCoopQrScanned(qr: string) {
    setScanning(false);
    const keep = vehicles.filter((v) => v.payment_qr_by_driver).length;
    const apply = vehicles.length - keep;
    const noun = (n: number) => `${n} vehicle${n === 1 ? "" : "s"}`;
    if (apply === 0) {
      Alert.alert("Nothing to apply", "Every vehicle keeps its driver's QR.");
      return;
    }
    Alert.alert(
      `Apply to ${noun(apply)}?`,
      keep > 0 ? `${noun(keep)} keep${keep === 1 ? "s" : ""} the driver's QR.` : undefined,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            setActionError(null);
            try {
              setApplied(`Applied to ${noun(await applyCoopPaymentQr(qr))}`);
              await reload();
            } catch (e) {
              setActionError((e as Error).message);
            }
          },
        },
      ],
    );
  }

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      {/* The header carries the title. */}
      <Stack.Screen options={{ title: "Vehicles" }} />

      {error && <ErrorState message={error} onRetry={reload} />}

      {!error && vehicles.length === 0 && <EmptyState icon="bus-side" message="No vehicles yet" />}

      {vehicles.map((v) => (
        <Card key={v.id}>
          <Text className="text-lg font-semibold text-foreground">
            {v.plate} · {VEHICLE_TYPE_LABELS[v.vehicle_type]}
          </Text>
          <Text className="text-muted">
            {v.route ? `${v.route.terminal.name} → ${v.route.destination_name}` : "No route"}
          </Text>
          <Text className="text-muted">
            {v.driver_id ? (v.driver?.full_name ?? "Unnamed driver") : "No driver"}
          </Text>
          <Text className="font-medium text-foreground">Status: {STATUS_LABELS[v.status]}</Text>
          <Text className="text-muted">
            Payment QR:{" "}
            {v.payment_qr ? (v.payment_qr_by_driver ? "set by driver" : "set by coop") : "none"}
          </Text>
          <Chips
            options={STATUS_OPTIONS}
            value={v.status}
            onChange={(s) => onStatus(v.id, s)}
            disabled={busyId === v.id}
          />
          <Button
            label="Edit ›"
            variant="link"
            className="self-start"
            onPress={() =>
              router.push({
                pathname: "/coop/vehicle",
                params: {
                  id: v.id,
                  plate: v.plate,
                  vehicle_type: v.vehicle_type,
                  route_id: v.route_id ?? "",
                  driver_id: v.driver_id ?? "",
                },
              })
            }
          />
        </Card>
      ))}

      {actionError && <Text className="text-destructive">{actionError}</Text>}
      {applied && <Text className="font-semibold text-foreground">{applied}</Text>}

      {scanning ? (
        <PaymentQrScanner onScanned={onCoopQrScanned} onCancel={() => setScanning(false)} />
      ) : (
        vehicles.length > 0 && (
          <Button
            label="Apply coop QR to vehicles"
            variant="outline"
            onPress={() => {
              setApplied(null);
              setScanning(true);
            }}
          />
        )
      )}

      <Button label="Add vehicle" onPress={() => router.push("/coop/vehicle")} />
    </ScrollView>
  );
}
