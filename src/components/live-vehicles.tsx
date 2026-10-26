import { CircleLayer, ShapeSource, SymbolLayer } from "@rnmapbox/maps";
import type { FeatureCollection } from "geojson";

import { useVehiclePositions } from "@/hooks/use-vehicle-positions";
import { colors } from "@/lib/colors";

const STATUS_LABELS = { off_duty: "Off duty", loading: "Now loading", departed: "Departed" };

// Drop inside a MapView. The label carries plate and status, never color alone.
// Placeholder look (secondary dot plus label) until the designer sends a vehicle marker.
export function LiveVehicles({ routeIds }: { routeIds: string[] }) {
  const vehicles = useVehiclePositions(routeIds);
  const shape: FeatureCollection = {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature",
      properties: { label: `${v.plate} · ${STATUS_LABELS[v.status]}` },
      geometry: { type: "Point", coordinates: [v.lng, v.lat] },
    })),
  };

  return (
    <ShapeSource id="live-vehicles" shape={shape}>
      <CircleLayer
        id="live-vehicle-dot"
        style={{
          circleColor: colors.secondary,
          circleRadius: 9,
          circleStrokeColor: "#FFFFFF",
          circleStrokeWidth: 3,
        }}
      />
      <SymbolLayer
        id="live-vehicle-label"
        style={{
          textField: ["get", "label"],
          textSize: 12,
          textColor: colors.foreground,
          textHaloColor: "#FFFFFF",
          textHaloWidth: 1.5,
          textOffset: [0, 1.6],
          textAllowOverlap: true,
        }}
      />
    </ShapeSource>
  );
}
