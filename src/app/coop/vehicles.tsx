import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { Chips, VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      <Stack.Screen options={{ title: "Vehicles" }} />
      <Text className="text-2xl font-bold text-foreground">Vehicles</Text>

      {error && (
        <View className="gap-2">
          <Text className="text-destructive">{error}</Text>
          <Pressable accessibilityRole="button" onPress={reload}>
            <Text className="font-semibold text-primary">Try again</Text>
          </Pressable>
        </View>
      )}

      {!error && vehicles.length === 0 && <Text className="text-muted">No vehicles yet</Text>}

      {vehicles.map((v) => (
        <View key={v.id} className="gap-3 rounded-lg border border-border bg-white p-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${v.plate}`}
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
            className="gap-1"
          >
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
          </Pressable>
          <Chips
            options={STATUS_OPTIONS}
            value={v.status}
            onChange={(s) => onStatus(v.id, s)}
            disabled={busyId === v.id}
          />
        </View>
      ))}

      {actionError && <Text className="text-destructive">{actionError}</Text>}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/coop/vehicle")}
        className="items-center rounded-lg bg-primary py-3"
      >
        <Text className="font-semibold text-white">Add vehicle</Text>
      </Pressable>
    </ScrollView>
  );
}
