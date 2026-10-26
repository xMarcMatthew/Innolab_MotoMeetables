import Mapbox, { Camera, CircleLayer, LineLayer, MapView, ShapeSource } from "@rnmapbox/maps";
import { useLocalSearchParams } from "expo-router";
import type { Feature, FeatureCollection, Position } from "geojson";
import { useMemo } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";

import { FareLines, StatusLine } from "@/components/commuter/ride-lines";
import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { useRouteDetail } from "@/hooks/use-route-detail";
import { colors } from "@/lib/colors";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// A constant: Camera re-frames whenever it gets a new padding object.
const PADDING = { paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 };

const point = (kind: string, coordinates: Position): Feature => ({
  type: "Feature",
  properties: { kind },
  geometry: { type: "Point", coordinates },
});

export default function RouteScreen() {
  const { routeId, lat, lng, myLat, myLng } = useLocalSearchParams<{
    routeId: string;
    lat: string;
    lng: string;
    myLat?: string;
    myLng?: string;
  }>();
  const { route, loading, error, reload } = useRouteDetail(
    routeId,
    Number(lat),
    Number(lng),
    myLat === undefined ? undefined : Number(myLat),
    myLng === undefined ? undefined : Number(myLng),
  );

  const map = useMemo(() => {
    if (!route) return null;
    const terminal: Position = [route.terminal.lng, route.terminal.lat];
    const line = route.line?.coordinates ?? [];
    // The seed puts each destination at the last point of its route line.
    const shape: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        ...(route.line
          ? [{ type: "Feature" as const, properties: { kind: "route" }, geometry: route.line }]
          : []),
        point("terminal", terminal),
        ...(line.length > 0 ? [point("destination", line[line.length - 1])] : []),
      ],
    };
    const all = [terminal, ...line];
    // A route a coop added in the app has no line yet; a one-point box would zoom all the way in.
    const camera =
      line.length > 0
        ? {
            bounds: {
              sw: [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1]))],
              ne: [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))],
            },
          }
        : { centerCoordinate: terminal, zoomLevel: 15 };
    return { shape, camera };
  }, [route]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !route || !map) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text className="text-center text-destructive">{error ?? "Route not found"}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={reload}
          className="min-h-12 justify-center rounded-lg bg-primary px-6 active:opacity-80"
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
      </View>
    );
  }

  const { terminal } = route;
  const goToTerminal = () =>
    Linking.openURL(
      `geo:${terminal.lat},${terminal.lng}?q=${terminal.lat},${terminal.lng}(${encodeURIComponent(terminal.name)})`,
    ).catch(() =>
      Alert.alert("No maps app", "Install a maps app to get directions to the terminal."),
    );

  return (
    <View className="flex-1 bg-background">
      <View className="h-[55%]">
        <MapView style={{ flex: 1 }} styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}>
          <Camera {...map.camera} padding={PADDING} animationDuration={0} />
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
                circleStrokeColor: "#FFFFFF",
                circleStrokeWidth: 2,
              }}
            />
            <CircleLayer
              id="destination"
              filter={["==", ["get", "kind"], "destination"]}
              style={{
                circleColor: colors.primary,
                circleRadius: 8,
                circleStrokeColor: "#FFFFFF",
                circleStrokeWidth: 2,
              }}
            />
          </ShapeSource>
          {/* After H10: live vehicle markers from vehicle_positions (Realtime) go here. */}
        </MapView>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4">
        <Text className="text-lg font-semibold text-foreground">
          Ride the {VEHICLE_TYPE_LABELS[route.vehicleType].toLowerCase()} from {terminal.name} to{" "}
          {route.destinationName}
        </Text>
        <StatusLine count={route.loadingCount} />
        <FareLines option={route} />
        <Pressable
          accessibilityRole="button"
          onPress={goToTerminal}
          className="min-h-12 items-center justify-center rounded-lg bg-primary active:opacity-80"
        >
          <Text className="font-semibold text-white">Go to terminal</Text>
        </Pressable>
        {/* After H10: Scan to board (board_vehicle) and Pay (the vehicle's payment_qr) go here. */}
      </ScrollView>
    </View>
  );
}
