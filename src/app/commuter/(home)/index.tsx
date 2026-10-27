import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Mapbox, { Camera, CircleLayer, MapView, ShapeSource, UserLocation } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { type ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuickTrips } from "@/components/commuter/quick-trips";
import { RideOptions } from "@/components/commuter/ride-options";
import { useDestinations } from "@/hooks/use-destinations";
import { type Destination, searchPlaces } from "@/lib/api/commuter";
import { colors } from "@/lib/colors";
import { getMyLocation } from "@/lib/my-location";
import { UNNAMED_PIN } from "@/lib/saved-trips";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// Naga City centre, [lng, lat]
const NAGA: [number, number] = [123.1948, 13.6218];

// Sheet resting heights: a peek for the tip, half the screen for the rides, most of it when dragged up.
const PEEK = 96;
const SNAP_POINTS = [PEEK, "50%", "85%"];

// Mapbox results are kept with the text they answer, so a reply for older text never shows.
type PlaceSearch = { text: string; places: Destination[]; failed: boolean };

// Tap toggles the sheet, so dragging is never the only way to open it (WCAG 2.2, dragging movements).
function SheetHandle({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? "Shrink the rides panel" : "Open the rides panel"}
      onPress={onPress}
      className="items-center py-3"
    >
      <View className="h-1.5 w-12 rounded-full bg-muted" />
    </Pressable>
  );
}

// The map fills the screen. The search bar is fixed at the top with the quick trips in one row under it;
// the rides live in a draggable bottom sheet, as in the ride-hailing apps.
export default function CommuterHome() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { destinations, loading, error, reload } = useDestinations();
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [placeSearch, setPlaceSearch] = useState<PlaceSearch | null>(null);
  const [pin, setPin] = useState<Destination | null>(null);
  const [showMe, setShowMe] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);
  const camera = useRef<ComponentRef<typeof Camera>>(null);
  const sheet = useRef<BottomSheet>(null);

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

  // A new destination: pin it, keep it in the top half of the map above the sheet, open the sheet on the rides.
  function choose(d: Destination) {
    Keyboard.dismiss();
    setListOpen(false);
    setPin(d);
    setQuery(d.name === UNNAMED_PIN ? "" : d.name);
    camera.current?.setCamera({
      centerCoordinate: [d.lng, d.lat],
      zoomLevel: 15,
      padding: { paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: height * 0.5 },
      animationDuration: 600,
    });
    sheet.current?.snapToIndex(1);
  }

  function clear() {
    setPin(null);
    setQuery("");
    setListOpen(false);
    sheet.current?.snapToIndex(0);
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

  const toggleSheet = () => sheet.current?.snapToIndex(sheetIndex === 0 ? 1 : 0);
  const Handle = useCallback(
    () => <SheetHandle open={sheetIndex > 0} onPress={toggleSheet} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toggleSheet only reads sheetIndex
    [sheetIndex],
  );

  return (
    <View className="flex-1 bg-background">
      <MapView
        style={{ flex: 1 }}
        styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}
        onPress={(feature) => {
          if (feature.geometry.type !== "Point") return;
          const [lng, lat] = feature.geometry.coordinates;
          choose({ lat, lng, name: UNNAMED_PIN });
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

      {/* Fixed at the top: the search bar first, then the quick trips in one row, then the results. */}
      <View className="absolute left-4 right-4 gap-2" style={{ top: insets.top + 8 }}>
        <View className="flex-row items-center rounded-lg border border-border bg-white shadow-sm">
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
            className="min-h-12 flex-1 px-4 text-base text-foreground"
          />
          {(query !== "" || pin) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear destination"
              onPress={clear}
              className="size-12 items-center justify-center active:opacity-80"
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <QuickTrips onPick={(t) => choose({ name: t.name, lat: t.lat, lng: t.lng })} />
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
            className="max-h-72 rounded-lg border border-border bg-white shadow-sm"
            keyboardShouldPersistTaps="handled"
          >
            {rows.map((d) => (
              <Pressable
                key={`${d.name}|${d.lat}|${d.lng}`}
                accessibilityRole="button"
                onPress={() => choose(d)}
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

      {/* Floats just above the resting sheet; an open sheet covers it, since the map is not in use then. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Near me"
        onPress={nearMe}
        className="absolute right-4 size-12 items-center justify-center rounded-full border border-muted bg-white shadow-sm active:opacity-80"
        style={{ bottom: PEEK + 16 }}
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color={colors.foreground} />
      </Pressable>

      <BottomSheet
        ref={sheet}
        index={0}
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        onChange={setSheetIndex}
        handleComponent={Handle}
        backgroundStyle={{ backgroundColor: colors.white }}
      >
        {pin ? (
          <>
            <Text numberOfLines={1} className="px-4 pb-2 text-lg font-semibold text-foreground">
              Rides to {pin.name === UNNAMED_PIN ? "your pin" : pin.name}
            </Text>
            <BottomSheetScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            >
              <RideOptions pin={pin} place={pin.name === UNNAMED_PIN ? undefined : pin.name} />
            </BottomSheetScrollView>
          </>
        ) : (
          // A tip, not a control: muted text, no box, nothing to press.
          <View className="flex-row items-center justify-center gap-2 px-6 opacity-70">
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.muted} />
            <Text className="text-muted">Search a place or tap the map</Text>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}
