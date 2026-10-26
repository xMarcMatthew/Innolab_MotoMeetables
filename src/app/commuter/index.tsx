import Mapbox, { Camera, CircleLayer, LineLayer, MapView, ShapeSource } from "@rnmapbox/maps";
import type { FeatureCollection, Position } from "geojson";
import { View } from "react-native";

import pacolCentro from "../../../data/routes/pacol-centro.json";
import { SignOutButton } from "@/components/sign-out-button";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// shortcut: one route file from the repo, swap for routes.route_line from Supabase once Rj's seed is in
const routes = pacolCentro as FeatureCollection;

const points: Position[] = routes.features.flatMap((f) =>
  f.geometry.type === "LineString"
    ? f.geometry.coordinates
    : f.geometry.type === "Point"
      ? [f.geometry.coordinates]
      : [],
);
const bounds = {
  sw: [Math.min(...points.map((p) => p[0])), Math.min(...points.map((p) => p[1]))],
  ne: [Math.max(...points.map((p) => p[0])), Math.max(...points.map((p) => p[1]))],
};

export default function CommuterHome() {
  return (
    <View className="flex-1 bg-background">
      <MapView style={{ flex: 1 }} styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}>
        <Camera
          bounds={bounds}
          padding={{ paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 }}
          animationDuration={0}
        />
        <ShapeSource id="routes" shape={routes}>
          {/* Map layers take raw colors: primary and accent from tailwind.config.js */}
          <LineLayer
            id="route-lines"
            filter={["==", ["get", "kind"], "route"]}
            style={{ lineColor: "#2563EB", lineWidth: 4, lineCap: "round", lineJoin: "round" }}
          />
          <CircleLayer
            id="terminals"
            filter={["==", ["get", "kind"], "terminal"]}
            style={{
              circleColor: "#EA580C",
              circleRadius: 7,
              circleStrokeColor: "#FFFFFF",
              circleStrokeWidth: 2,
            }}
          />
        </ShapeSource>
      </MapView>
      <View className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2">
        <SignOutButton />
      </View>
    </View>
  );
}
