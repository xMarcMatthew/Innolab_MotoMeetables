import { Text, View } from "react-native";

import { Badge } from "@/components/ui/badge";
import type { RideOption } from "@/lib/api/commuter";

export const peso = (n: number) => `₱${n.toFixed(2)}`;

// Always a text label; the orange badge only adds to it (Palette A: accent for "now loading").
export function StatusLine({ count }: { count: number }) {
  if (count === 0) return <Text className="text-muted">None loading right now</Text>;
  return <Badge label={`${count} now loading`} />;
}

// The headline is the fare to the drop point (migration 8). The driver's fare is set for the whole route,
// so it is compared with the full-route guide, never with the drop fare.
export function FareLines({ option, place }: { option: RideOption; place: string }) {
  const { guideFareRegular: guide, guideFareDiscounted: discounted, driverFare } = option;
  const { fareRegular, fareDiscounted, dropKm } = option;
  const dropDetail = [
    fareDiscounted !== null && `${peso(fareDiscounted)} discounted`,
    dropKm !== null && `${dropKm.toFixed(1)} km`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <View className="gap-1">
      {fareRegular !== null && (
        <>
          <Text className="text-2xl font-bold text-foreground">
            {`Fare to ${place} ${peso(fareRegular)}`}
          </Text>
          {dropDetail !== "" && <Text className="text-muted">{dropDetail}</Text>}
        </>
      )}
      <Text className="text-foreground">
        {guide === null
          ? "Fare not set yet"
          : `${fareRegular === null ? "Official fare guide:" : "Full-route guide"} ${peso(guide)}${discounted === null ? "" : ` (${peso(discounted)} discounted)`}`}
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
