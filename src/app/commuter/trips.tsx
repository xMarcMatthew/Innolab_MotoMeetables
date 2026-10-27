import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { RefreshControl, ScrollView, SectionList, Text, View } from "react-native";

import { VEHICLE_TYPE_ICONS, VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionLabel } from "@/components/ui/section-label";
import { useMyTrips } from "@/hooks/use-my-trips";
import type { Trip } from "@/lib/api/trips";
import { colors } from "@/lib/colors";

// "Today", "Yesterday", then the date in the phone's own format.
function dayLabel(d: Date, now: Date) {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" as const }),
  });
}

const timeOf = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// The list is already newest first, so each day's rides are next to each other.
function byDay(trips: Trip[]) {
  const now = new Date();
  const sections: { title: string; data: Trip[] }[] = [];
  for (const t of trips) {
    const title = dayLabel(t.boardedAt, now);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(t);
    else sections.push({ title, data: [t] });
  }
  return sections;
}

// Plate first and largest (it is what the commuter saw on the jeep), the type under it, then the route;
// the time sits top right so a day's rides scan down the edge.
function TripCard({ trip }: { trip: Trip }) {
  const v = trip.vehicle;
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        {/* Decorative next to the text label, so hidden from screen readers. */}
        <MaterialCommunityIcons
          name={v ? VEHICLE_TYPE_ICONS[v.vehicleType] : "bus-alert"}
          size={28}
          color={colors.primary}
          importantForAccessibility="no"
        />
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            {v ? v.plate : "Vehicle removed"}
          </Text>
          {v && <Text className="text-muted">{VEHICLE_TYPE_LABELS[v.vehicleType]}</Text>}
        </View>
        <Text className="text-muted">{timeOf(trip.boardedAt)}</Text>
      </View>
      {v?.destinationName && (
        <Text className="font-medium text-foreground">
          {v.terminalName ? `${v.terminalName} → ${v.destinationName}` : `To ${v.destinationName}`}
        </Text>
      )}
    </Card>
  );
}

// The commuter's rides, newest first, grouped by day. Each row is a boarding scan.
export default function TripsScreen() {
  const { trips, loading, refreshing, error, refresh, retry } = useMyTrips();

  if (loading) return <LoadingState />;

  // A failed refresh keeps the rides already on screen; the error shows only when nothing loaded yet.
  if (error && trips.length === 0) {
    return (
      <View className="flex-1 justify-center bg-background p-6">
        <ErrorState message={`Could not load your rides: ${error}`} onRetry={retry} />
      </View>
    );
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />
  );

  // Pull down works here too, so a scan made a moment ago can be fetched without leaving the tab.
  if (trips.length === 0) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        refreshControl={refreshControl}
      >
        <EmptyState
          icon="bus-clock"
          message="Your rides will show here after your first boarding scan."
          action={{ label: "Find a ride", onPress: () => router.navigate("/commuter") }}
        />
      </ScrollView>
    );
  }

  return (
    <SectionList
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 }}
      sections={byDay(trips)}
      keyExtractor={(t) => t.id}
      stickySectionHeadersEnabled={false}
      refreshControl={refreshControl}
      renderSectionHeader={({ section }) => (
        <View className="pb-2 pt-4">
          <SectionLabel>{section.title}</SectionLabel>
        </View>
      )}
      renderItem={({ item }) => (
        <View className="mb-3">
          <TripCard trip={item} />
        </View>
      )}
    />
  );
}
