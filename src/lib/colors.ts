// Palette A for props that cannot take a className (Mapbox layer styles, tab bar tint).
// Keep in sync with tailwind.config.js; everywhere else use the NativeWind classes.
export const colors = {
  primary: "#2563EB",
  accent: "#EA580C",
  secondary: "#0891B2",
  background: "#F8FAFC",
  foreground: "#0F172A",
  muted: "#475569",
  border: "#E4ECFC",
  destructive: "#DC2626",
  white: "#FFFFFF",
} as const;
