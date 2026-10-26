import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { useTerminalRoutes } from "@/hooks/use-terminal-routes";

const TYPE_LABELS = { jeepney: "Jeepney", tricycle: "Tricycle", bus: "Bus" };

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      <Stack.Screen options={{ title: "Routes" }} />
      <Text className="text-2xl font-bold text-foreground">{terminalName}</Text>

      {error && (
        <View className="gap-2">
          <Text className="text-destructive">{error}</Text>
          <Pressable accessibilityRole="button" onPress={reload}>
            <Text className="font-semibold text-primary">Try again</Text>
          </Pressable>
        </View>
      )}

      {!error && routes.length === 0 && <Text className="text-muted">No routes yet</Text>}

      {routes.map((r) => (
        <Pressable
          key={r.id}
          accessibilityRole="button"
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
          className="gap-1 rounded-lg border border-border bg-white p-4"
        >
          <Text className="text-lg font-semibold text-foreground">{r.destination_name}</Text>
          <Text className="text-muted">
            {TYPE_LABELS[r.vehicle_type]} · {peso(r.guide_fare_regular)}
            {r.guide_fare_discounted !== null && ` / ${peso(r.guide_fare_discounted)} discounted`}
          </Text>
        </Pressable>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/coop/route", params: { terminalId } })}
        className="items-center rounded-lg bg-primary py-3"
      >
        <Text className="font-semibold text-white">Add route</Text>
      </Pressable>
    </ScrollView>
  );
}
