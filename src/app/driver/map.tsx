import Mapbox, {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  ShapeSource,
  SymbolLayer,
} from "@rnmapbox/maps";
import { useFocusEffect } from "expo-router";
import type { Feature, FeatureCollection, Position } from "geojson";
import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { LiveVehicles } from "@/components/live-vehicles";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useMyVehicle } from "@/hooks/use-my-vehicle";
import { getMyDropPointsToday } from "@/lib/api/driver";
import { colors } from "@/lib/colors";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// Same refresh as the QR tab's passenger count. Drivers cannot read boardings, so no Realtime.
const DROPS_REFRESH_MS = 5000;

// A constant: Camera re-frames whenever it gets a new padding object. Extra bottom room for the caption.
const PADDING = { paddingTop: 48, paddingBottom: 120, paddingLeft: 48, paddingRight: 48 };

const point = (kind: string, coordinates: Position): Feature => ({
  type: "Feature",
  properties: { kind },
  geometry: { type: "Point", coordinates },
});

// The driver's route, the live jeeps on it (their own included) and where today's passengers get off.
export default function DriverMap() {
  const { vehicle, loading, error, reload } = useMyVehicle();
  const [drops, setDrops] = useState<{ lat: number; lng: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      const refreshDrops = () =>
        getMyDropPointsToday()
          .then(setDrops)
          .catch(() => {}); // keep the last points
      refreshDrops();
      const timer = setInterval(refreshDrops, DROPS_REFRESH_MS);
      return () => clearInterval(timer);
    }, []),
  );

  const route = vehicle?.route;
  const map = useMemo(() => {
    if (!route?.route_line) return null;
    const terminal: Position = [route.terminal.lng, route.terminal.lat];
    const line = route.route_line.coordinates;
    // The seed puts each destination at the last point of its route line.
    const shape: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { kind: "route" }, geometry: route.route_line },
        point("terminal", terminal),
        point("destination", line[line.length - 1]),
      ],
    };
    const all = [terminal, ...line];
    const bounds = {
      sw: [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1]))],
      ne: [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))],
    };
    return { shape, bounds };
  }, [route]);

  if (loading) return <LoadingState />;

  // A failed reload keeps the map already on screen; the error shows only when nothing loaded yet.
  if (error && !vehicle) {
    return (
      <View className="flex-1 justify-center bg-background p-6">
        <ErrorState message={`Could not load your vehicle: ${error}`} onRetry={reload} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View className="flex-1 justify-center bg-background">
        <EmptyState
          icon="map-marker-off"
          message="No vehicle assigned yet. Ask your coop to assign you one."
          action={{ label: "Check again", onPress: reload }}
        />
      </View>
    );
  }

  if (!route || !map) {
    return (
      <View className="flex-1 justify-center bg-background">
        <EmptyState icon="map-marker-off" message="Your coop has not drawn this route yet." />
      </View>
    );
  }

  const dropShape: FeatureCollection = {
    type: "FeatureCollection",
    features: drops.map((d) => point("drop", [d.lng, d.lat])),
  };

  return (
    <View className="flex-1 bg-background">
      <MapView style={{ flex: 1 }} styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}>
        <Camera bounds={map.bounds} padding={PADDING} animationDuration={0} />
        <ShapeSource id="route" shape={map.shape}>
          {/* Map layers take raw colors from src/lib/colors.ts */}
          <LineLayer
            id="route-line"
            filter={["==", ["get", "kind"], "route"]}
            style={{
              lineColor: colors.primary,
              lineWidth: 4,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          <CircleLayer
            id="terminal"
            filter={["==", ["get", "kind"], "terminal"]}
            style={{
              circleColor: colors.accent,
              circleRadius: 8,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 2,
            }}
          />
          <CircleLayer
            id="destination"
            filter={["==", ["get", "kind"], "destination"]}
            style={{
              circleColor: colors.primary,
              circleRadius: 8,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 2,
            }}
          />
        </ShapeSource>
        {/* Before LiveVehicles so the jeeps draw on top. The label means it never relies on color alone. */}
        <ShapeSource id="drop-points" shape={dropShape}>
          <CircleLayer
            id="drop-point-dot"
            style={{
              circleColor: colors.accent,
              circleRadius: 7,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 2,
            }}
          />
          <SymbolLayer
            id="drop-point-label"
            style={{
              textField: "Drop-off",
              textSize: 12,
              textColor: colors.foreground,
              textHaloColor: colors.white,
              textHaloWidth: 1.5,
              textOffset: [0, 1.6],
              textAllowOverlap: true,
            }}
          />
        </ShapeSource>
        <LiveVehicles routeIds={[route.id]} />
      </MapView>

      {/* The tab bar already sits above the bottom safe area, and the header covers the top. */}
      <View className="absolute bottom-4 left-4 right-4 rounded-xl bg-white p-4 shadow-sm">
        <Text className="text-center text-foreground">
          {drops.length === 0
            ? "No drop-offs yet. Passengers who scan your QR appear here."
            : `${drops.length} ${drops.length === 1 ? "passenger" : "passengers"} getting off today`}
        </Text>
      </View>
    </View>
  );
}
