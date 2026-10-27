import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/lib/colors";
import { getSuggestions, removeTrip, type SavedTrip, togglePin } from "@/lib/saved-trips";

// Up to 3 usual destinations in one row that scrolls sideways under the search box: pinned, then frequent,
// then recent. Reloads on focus, so a pick made on the Route screen shows when the commuter comes back.
export function QuickTrips({ onPick }: { onPick: (trip: SavedTrip) => void }) {
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  const reload = useCallback(() => {
    getSuggestions().then(setTrips);
  }, []);

  useFocusEffect(reload);

  if (trips.length === 0) return null;

  const act = (change: (t: SavedTrip) => Promise<void>, t: SavedTrip) => change(t).then(reload);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      className="grow-0"
      contentContainerClassName="flex-row gap-2"
    >
      {trips.map((t) => (
        <View
          key={`${t.name}|${t.lat}|${t.lng}`}
          className="min-h-12 flex-row items-center rounded-full border border-border bg-white shadow-sm"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Rides to ${t.name}`}
            onPress={() => onPick(t)}
            className="justify-center pl-4 pr-2 active:opacity-80"
          >
            <Text numberOfLines={1} className="max-w-40 font-semibold text-foreground">
              {t.name}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.pinned ? `Unpin ${t.name}` : `Pin ${t.name}`}
            accessibilityState={{ selected: t.pinned }}
            hitSlop={6}
            onPress={() => act(togglePin, t)}
            className="size-10 items-center justify-center active:opacity-80"
          >
            <MaterialCommunityIcons
              name={t.pinned ? "star" : "star-outline"}
              size={22}
              color={t.pinned ? colors.accent : colors.muted}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${t.name}`}
            hitSlop={6}
            onPress={() => act(removeTrip, t)}
            className="size-10 items-center justify-center pr-1 active:opacity-80"
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
