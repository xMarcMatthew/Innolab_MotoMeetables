import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { FareLines, StatusLine } from "@/components/commuter/ride-lines";
import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useRideOptions } from "@/hooks/use-ride-options";
import type { LatLng } from "@/lib/api/commuter";
import { colors } from "@/lib/colors";
import { recordPick } from "@/lib/saved-trips";

const distance = (m: number) =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;

// Rides to the Home pin, inside the bottom sheet: one card per nearest_routes row, in the database's order.
// place is undefined for an unnamed map tap. Tapping a card opens the Route screen.
export function RideOptions({ pin, place }: { pin: LatLng; place?: string }) {
  const { options, me, loading, error, reload } = useRideOptions(pin.lat, pin.lng);
  const shown = place ?? "your pin";

  // Remember this destination for the quick trips; it never blocks the list.
  useEffect(() => {
    recordPick({ name: place, lat: pin.lat, lng: pin.lng });
  }, [place, pin.lat, pin.lng]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (options.length === 0) {
    return (
      <EmptyState
        icon="map-marker-off"
        message={
          place
            ? `No rides to ${place} yet. Try another place.`
            : "No terminal serves that spot yet. Try another place."
        }
      />
    );
  }

  return (
    <View className="gap-3">
      {options.map((o) => (
        <Card
          key={o.routeId}
          chevron
          accessibilityLabel={`${VEHICLE_TYPE_LABELS[o.vehicleType]} to ${o.destinationName}, from ${o.terminal.name}`}
          onPress={() =>
            router.push({
              pathname: "/commuter/route",
              params: {
                routeId: o.routeId,
                lat: pin.lat,
                lng: pin.lng,
                ...(place !== undefined && { label: place }),
                ...(me && { myLat: me.lat, myLng: me.lng }),
              },
            })
          }
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name={VEHICLE_TYPE_ICONS[o.vehicleType]}
              size={24}
              color={colors.primary}
              importantForAccessibility="no"
            />
            <Text className="text-lg font-semibold text-foreground">
              {VEHICLE_TYPE_LABELS[o.vehicleType]}
            </Text>
          </View>
          <Text className="text-foreground">To {o.destinationName}</Text>
          {o.dropMetres > 150 && (
            <Text className="text-muted">
              Drops you {distance(o.dropMetres)} from {shown}
            </Text>
          )}
          <Text className="text-foreground">
            Board at {o.terminal.name}
            {o.terminalMetres !== null && ` · ${distance(o.terminalMetres)} away`}
          </Text>
          <StatusLine count={o.loadingCount} />
          <FareLines option={o} place={shown} />
        </Card>
      ))}
    </View>
  );
}
