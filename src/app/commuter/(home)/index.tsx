import { MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox, { Camera, CircleLayer, MapView, ShapeSource, UserLocation } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { type ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMyLocation } from "@/lib/my-location";
import { QuickTrips } from "@/components/commuter/quick-trips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDestinations } from "@/hooks/use-destinations";
import { type Destination, searchPlaces } from "@/lib/api/commuter";
import { colors } from "@/lib/colors";
import { UNNAMED_PIN } from "@/lib/saved-trips";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// Naga City centre, [lng, lat]
const NAGA: [number, number] = [123.1948, 13.6218];

// Mapbox results are kept with the text they answer, so a reply for older text never shows.
type PlaceSearch = { text: string; places: Destination[]; failed: boolean };

export default function CommuterHome() {
  const insets = useSafeAreaInsets();
  const { destinations, loading, error, reload } = useDestinations();
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [placeSearch, setPlaceSearch] = useState<PlaceSearch | null>(null);
  const [pin, setPin] = useState<Destination | null>(null);
  const [showMe, setShowMe] = useState(false);
  const camera = useRef<ComponentRef<typeof Camera>>(null);

  // Checking never asks; the dot appears once permission exists (granted here or on Options).
  useFocusEffect(
    useCallback(() => {
      Location.getForegroundPermissionsAsync().then((p) => setShowMe(p.granted));
    }, []),
  );

  const text = query.trim();
  const q = text.toLowerCase();
  const ours = q ? destinations.filter((d) => d.name.toLowerCase().includes(q)) : [];
  // Place search starts at 3 characters, 300 ms after the last keystroke.
  const placeText = listOpen && text.length >= 3 ? text : "";

  useEffect(() => {
    if (placeText === "") return;
    let stale = false;
    const timer = setTimeout(() => {
      searchPlaces(placeText)
        .then((places) => !stale && setPlaceSearch({ text: placeText, places, failed: false }))
        .catch(() => !stale && setPlaceSearch({ text: placeText, places: [], failed: true }));
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [placeText]);

  const done = placeText !== "" && placeSearch?.text === placeText ? placeSearch : null;
  const ourNames = new Set(ours.map((d) => d.name.toLowerCase()));
  const rows = [
    ...ours,
    ...(done?.places.filter((p) => !ourNames.has(p.name.toLowerCase())) ?? []),
  ];
  const searching = loading || (placeText !== "" && !done);

  function pick(d: Destination) {
    Keyboard.dismiss();
    setPin(d);
    setQuery(d.name);
    setListOpen(false);
    camera.current?.setCamera({
      centerCoordinate: [d.lng, d.lat],
      zoomLevel: 15,
      animationDuration: 600,
    });
  }

  async function nearMe() {
    const me = await getMyLocation(true);
    if (!me) {
      Alert.alert(
        "Location is off",
        "Allow location for Larga in your phone's settings to use this.",
      );
      return;
    }
    setShowMe(true);
    camera.current?.setCamera({
      centerCoordinate: [me.lng, me.lat],
      zoomLevel: 15,
      animationDuration: 600,
    });
  }

  return (
    <View className="flex-1 bg-background">
      <MapView
        style={{ flex: 1 }}
        styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}
        onPress={(feature) => {
          if (feature.geometry.type !== "Point") return;
          const [lng, lat] = feature.geometry.coordinates;
          Keyboard.dismiss();
          setListOpen(false);
          setPin({ lat, lng, name: UNNAMED_PIN });
        }}
      >
        <Camera ref={camera} defaultSettings={{ centerCoordinate: NAGA, zoomLevel: 12 }} />
        {pin && (
          <ShapeSource
            id="pin"
            shape={{
              type: "Feature",
              properties: {},
              geometry: { type: "Point", coordinates: [pin.lng, pin.lat] },
            }}
          >
            {/* Map layers take raw colors from src/lib/colors.ts */}
            <CircleLayer
              id="pin-circle"
              style={{
                circleColor: colors.accent,
                circleRadius: 9,
                circleStrokeColor: colors.white,
                circleStrokeWidth: 3,
              }}
            />
          </ShapeSource>
        )}
        {showMe && <UserLocation />}
      </MapView>

      <View className="absolute left-4 right-4 gap-2" style={{ top: insets.top + 8 }}>
        <QuickTrips />
        <TextInput
          accessibilityLabel="Where to?"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setListOpen(true);
          }}
          placeholder="Where to? e.g. Sports complex"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          className="min-h-12 rounded-lg border border-border bg-white px-4 text-base text-foreground"
        />
        {error && (
          <View className="flex-row items-center justify-between gap-2 rounded-lg bg-white px-4 py-2">
            <Text className="flex-1 text-destructive">{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={reload}
              className="min-h-12 justify-center active:opacity-80"
            >
              <Text className="font-semibold text-primary">Try again</Text>
            </Pressable>
          </View>
        )}
        {listOpen && q !== "" && (
          <ScrollView
            className="max-h-72 rounded-lg border border-border bg-white"
            keyboardShouldPersistTaps="handled"
          >
            {rows.map((d) => (
              <Pressable
                key={`${d.name}|${d.lat}|${d.lng}`}
                accessibilityRole="button"
                onPress={() => pick(d)}
                className="min-h-12 justify-center border-b border-border px-4 py-2 active:opacity-80"
              >
                <Text className="text-base text-foreground">{d.name}</Text>
                {!!d.detail && <Text className="text-sm text-muted">{d.detail}</Text>}
              </Pressable>
            ))}
            {rows.length === 0 && (
              <Text className="px-4 py-3 text-muted">
                {searching
                  ? "Searching..."
                  : text.length < 3
                    ? "Keep typing to search places"
                    : `No place called "${text}" found. Tap the map instead.`}
              </Text>
            )}
            {done?.failed && (
              <Text className="px-4 py-3 text-muted">Place search is unavailable right now</Text>
            )}
          </ScrollView>
        )}
      </View>

      <View className="absolute bottom-4 left-4 right-4 gap-3">
        {pin ? (
          <Card>
            <Text numberOfLines={1} className="text-lg font-semibold text-foreground">
              {pin.name}
            </Text>
            <Button
              label="Show rides"
              onPress={() =>
                router.push({
                  pathname: "/commuter/options",
                  params: {
                    lat: pin.lat,
                    lng: pin.lng,
                    ...(pin.name !== UNNAMED_PIN && { label: pin.name }),
                  },
                })
              }
            />
          </Card>
        ) : (
          <View className="rounded-lg border border-border bg-white px-4 py-3">
            <Text className="text-muted">Search a place or tap the map</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Near me"
          onPress={nearMe}
          className="size-12 items-center justify-center self-end rounded-full border border-muted bg-white active:opacity-80"
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}
