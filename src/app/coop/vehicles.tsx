import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text } from "react-native";

import { Chips, VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useMyVehicles } from "@/hooks/use-my-vehicles";
import { setVehicleStatusAsCoop, type VehicleStatus } from "@/lib/api/coop";
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

      <Button label="Add vehicle" onPress={() => router.push("/coop/vehicle")} />
    </ScrollView>
  );
}
