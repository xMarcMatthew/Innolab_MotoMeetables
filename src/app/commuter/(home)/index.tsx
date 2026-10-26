import { MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox, { Camera, CircleLayer, MapView, ShapeSource, UserLocation } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import type { FeatureCollection, Point } from "geojson";
import { type ComponentRef, useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMyLocation } from "@/lib/my-location";
import { QuickTrips } from "@/components/commuter/quick-trips";
import { PinPicker } from "@/components/coop/pin-picker";
import { useDestinations } from "@/hooks/use-destinations";
import type { LatLng } from "@/lib/api/commuter";
import { colors } from "@/lib/colors";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// Naga City centre, [lng, lat], until the terminals load. Padding is a constant: Camera re-frames on a new object.
const NAGA: [number, number] = [123.1948, 13.6218];
const PADDING = { paddingTop: 140, paddingBottom: 96, paddingLeft: 48, paddingRight: 48 };

export default function CommuterHome() {
  const insets = useSafeAreaInsets();
  const { destinations, terminals, loading, error, reload } = useDestinations();
  const [query, setQuery] = useState("");
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [showMe, setShowMe] = useState(false);
  const camera = useRef<ComponentRef<typeof Camera>>(null);

  // Checking never asks; the dot appears once permission exists (granted here or on Options).
  useFocusEffect(
    useCallback(() => {
      Location.getForegroundPermissionsAsync().then((p) => setShowMe(p.granted));
    }, []),
  );

  const dots = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: terminals.map((t) => ({
        type: "Feature",
        properties: { name: t.name },
        geometry: { type: "Point", coordinates: [t.lng, t.lat] },
      })),
    }),
    [terminals],
  );
  const bounds = useMemo(() => {
    if (terminals.length === 0) return undefined;
    const lngs = terminals.map((t) => t.lng);
    const lats = terminals.map((t) => t.lat);
    return {
      sw: [Math.min(...lngs), Math.min(...lats)],
      ne: [Math.max(...lngs), Math.max(...lats)],
    };
  }, [terminals]);

  const q = query.trim().toLowerCase();
  const matches = q ? destinations.filter((d) => d.name.toLowerCase().includes(q)) : [];

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

  if (pinMode) {
    return (
      <View className="flex-1 gap-4 bg-background px-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-lg font-semibold text-foreground">
          Tap the map where you want to go
        </Text>
        <PinPicker pin={pin} onPick={setPin} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !pin }}
          disabled={!pin}
          onPress={() =>
            pin &&
            router.push({ pathname: "/commuter/options", params: { lat: pin.lat, lng: pin.lng } })
          }
          className={`min-h-12 items-center justify-center rounded-lg bg-primary active:opacity-80 ${pin ? "" : "opacity-50"}`}
        >
          <Text className="font-semibold text-white">Show rides to this pin</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPinMode(false)}
          className="min-h-12 items-center justify-center rounded-lg border border-muted bg-white active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Back to search</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <MapView style={{ flex: 1 }} styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}>
        <Camera
          ref={camera}
          defaultSettings={{ centerCoordinate: NAGA, zoomLevel: 12 }}
          bounds={bounds}
          padding={PADDING}
          animationDuration={0}
        />
        <ShapeSource id="terminals" shape={dots}>
          {/* Map layers take raw colors: accent from src/lib/colors.ts */}
          <CircleLayer
            id="terminal-dots"
            style={{
              circleColor: colors.accent,
              circleRadius: 7,
              circleStrokeColor: "#FFFFFF",
              circleStrokeWidth: 2,
            }}
          />
        </ShapeSource>
        {showMe && <UserLocation />}
      </MapView>

      <View className="absolute left-4 right-4 gap-2" style={{ top: insets.top + 8 }}>
        <QuickTrips />
        <TextInput
          accessibilityLabel="Where to?"
          value={query}
          onChangeText={setQuery}
          placeholder="Where to? e.g. Pacol"
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
        {q !== "" && (
          <ScrollView
            className="max-h-72 rounded-lg border border-border bg-white"
            keyboardShouldPersistTaps="handled"
          >
            {matches.map((d) => (
              <Pressable
                key={d.name}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/commuter/options",
                    params: { lat: d.lat, lng: d.lng, label: d.name },
                  })
                }
                className="min-h-12 justify-center border-b border-border px-4 active:opacity-80"
              >
                <Text className="text-base text-foreground">{d.name}</Text>
              </Pressable>
            ))}
            {matches.length === 0 && (
              <Text className="px-4 py-3 text-muted">
                {loading
                  ? "Loading destinations..."
                  : `No destination called "${query.trim()}" yet. Try Drop a pin.`}
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      <View className="absolute bottom-4 left-4 right-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => setPinMode(true)}
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-muted bg-white active:opacity-80"
        >
          <MaterialCommunityIcons name="map-marker-plus" size={20} color={colors.foreground} />
          <Text className="font-semibold text-foreground">Drop a pin</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={nearMe}
          className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-muted bg-white active:opacity-80"
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color={colors.foreground} />
          <Text className="font-semibold text-foreground">Near me</Text>
        </Pressable>
      </View>
    </View>
  );
}
