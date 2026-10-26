import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { FareLines, StatusLine } from "@/components/commuter/ride-lines";
import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { useRideOptions } from "@/hooks/use-ride-options";
import { colors } from "@/lib/colors";

const distance = (m: number) =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;

export default function OptionsScreen() {
  const { lat, lng, label } = useLocalSearchParams<{ lat: string; lng: string; label?: string }>();
  const { options, me, loading, error, reload } = useRideOptions(Number(lat), Number(lng));
  const place = label ?? "your pin";

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (error || options.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text className={`text-center text-lg ${error ? "text-destructive" : "text-foreground"}`}>
          {error ?? (label ? `No rides to ${label} yet` : "No terminal serves that spot yet")}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={error ? reload : () => router.back()}
          className="min-h-12 justify-center rounded-lg bg-primary px-6 active:opacity-80"
        >
          <Text className="font-semibold text-white">
            {error ? "Try again" : "Search another place"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3 p-4">
      <Text className="text-lg font-semibold text-foreground">Rides to {place}</Text>
      {options.map((o) => (
        <Pressable
          key={o.routeId}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/commuter/route",
              params: { routeId: o.routeId, lat, lng, ...(me && { myLat: me.lat, myLng: me.lng }) },
            })
          }
          className="gap-2 rounded-lg border border-border bg-white p-4 active:opacity-80"
        >
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name={o.vehicleType === "tricycle" ? "rickshaw" : "bus"}
              size={24}
              color={colors.primary}
            />
            <Text className="text-lg font-semibold text-foreground">
              {VEHICLE_TYPE_LABELS[o.vehicleType]}
            </Text>
          </View>
          <Text className="text-foreground">To {o.destinationName}</Text>
          {o.dropMetres > 150 && (
            <Text className="text-muted">
              Drops you {distance(o.dropMetres)} from {place}
            </Text>
          )}
          <Text className="text-foreground">
            Board at {o.terminal.name}
            {o.terminalMetres !== null && ` · ${distance(o.terminalMetres)} away`}
          </Text>
          <StatusLine count={o.loadingCount} />
          <FareLines option={o} />
        </Pressable>
      ))}
      {/* shortcut: one guide fare per route, add per-stop fares if the coops publish them */}
      <Text className="text-sm text-muted">
        Fares are the official guide for the whole route, even if you get off earlier.
      </Text>
    </ScrollView>
  );
}
