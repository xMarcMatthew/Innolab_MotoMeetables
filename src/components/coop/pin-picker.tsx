import Mapbox, { Camera, CircleLayer, MapView, ShapeSource } from "@rnmapbox/maps";
import { View } from "react-native";

import { colors } from "@/lib/colors";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

// Naga City centre, [lng, lat]
const NAGA: [number, number] = [123.1948, 13.6218];

type Props = {
  pin: { lat: number; lng: number } | null;
  onPick: (pin: { lat: number; lng: number }) => void;
};

// Tap the map to place or move the pin. The camera starts on the existing pin, else on Naga.
export function PinPicker({ pin, onPick }: Props) {
  return (
    <View className="h-80 overflow-hidden rounded-lg border border-border">
      <MapView
        style={{ flex: 1 }}
        styleURL={process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL}
        onPress={(feature) => {
          if (feature.geometry.type !== "Point") return;
          const [lng, lat] = feature.geometry.coordinates;
          onPick({ lat, lng });
        }}
      >
        <Camera
          defaultSettings={{
            centerCoordinate: pin ? [pin.lng, pin.lat] : NAGA,
            zoomLevel: pin ? 15 : 13,
          }}
        />
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
      </MapView>
    </View>
  );
}
