import { Text, View } from "react-native";

import type { RideOption } from "@/lib/api/commuter";

export const peso = (n: number) => `₱${n.toFixed(2)}`;

// Always a text label; the orange badge only adds to it (Palette A: accent for "now loading").
export function StatusLine({ count }: { count: number }) {
  if (count === 0) return <Text className="text-muted">None loading right now</Text>;
  return (
    <View className="self-start rounded-full bg-accent px-3 py-1">
      <Text className="font-semibold text-white">{count} now loading</Text>
    </View>
  );
}

export function FareLines({ option }: { option: RideOption }) {
  const { guideFareRegular: guide, guideFareDiscounted: discounted, driverFare } = option;
  return (
    <View className="gap-1">
      <Text className="text-foreground">
        {guide === null
          ? "Fare not set yet"
          : `Official fare guide: ${peso(guide)}${discounted === null ? "" : ` (${peso(discounted)} discounted)`}`}
      </Text>
      {driverFare !== null && (
        <Text className="font-semibold text-foreground">{`Driver's fare ${peso(driverFare)}`}</Text>
      )}
      {driverFare !== null && guide !== null && driverFare > guide && (
        <Text className="font-semibold text-destructive">Above the official fare</Text>
      )}
    </View>
  );
}
