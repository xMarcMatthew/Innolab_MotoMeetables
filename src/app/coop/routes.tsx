import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text } from "react-native";

import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useTerminalRoutes } from "@/hooks/use-terminal-routes";

const peso = (n: number) => `₱${n.toFixed(2)}`;

// Routes of one terminal (id and name come from the terminal list row).
export default function TerminalRoutes() {
  const router = useRouter();
  const { terminalId, terminalName } = useLocalSearchParams<{
    terminalId: string;
    terminalName: string;
  }>();
  const { routes, loading, error, reload } = useTerminalRoutes(terminalId);

  // Coming back from the form must show the saved change.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      <Stack.Screen options={{ title: "Routes" }} />
      <Text className="text-2xl font-bold text-foreground">{terminalName}</Text>

      {error && <ErrorState message={error} onRetry={reload} />}

      {!error && routes.length === 0 && <EmptyState icon="routes" message="No routes yet" />}

      {routes.map((r) => (
        <Card
          key={r.id}
          chevron
          accessibilityLabel={`Edit route to ${r.destination_name}`}
          onPress={() =>
            router.push({
              pathname: "/coop/route",
              params: {
                terminalId,
                id: r.id,
                destination_name: r.destination_name,
                destination_lat: String(r.destination_lat),
                destination_lng: String(r.destination_lng),
                vehicle_type: r.vehicle_type,
                guide_fare_regular: String(r.guide_fare_regular),
                guide_fare_discounted:
                  r.guide_fare_discounted === null ? "" : String(r.guide_fare_discounted),
              },
            })
          }
        >
          <Text className="text-lg font-semibold text-foreground">{r.destination_name}</Text>
          <Text className="text-muted">
            {VEHICLE_TYPE_LABELS[r.vehicle_type]} · {peso(r.guide_fare_regular)}
            {r.guide_fare_discounted !== null && ` / ${peso(r.guide_fare_discounted)} discounted`}
          </Text>
        </Card>
      ))}

      <Button
        label="Add route"
        onPress={() => router.push({ pathname: "/coop/route", params: { terminalId } })}
      />
    </ScrollView>
  );
}
