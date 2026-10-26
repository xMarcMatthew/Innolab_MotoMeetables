import "../global.css";

import { Link, Stack } from "expo-router";
import { cssInterop } from "nativewind";

// NativeWind only styles core components on native; without this, className on Link works on web but not on the phone.
cssInterop(Link, { className: "style" });

export default function RootLayout() {
  return <Stack />;
}
