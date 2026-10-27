import type { LatLng } from "@/lib/api/commuter";

// Straight-line metres between two points (haversine). Good enough for "next drop-off in about 450 m".
export function metresBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// "450 m" or "1.2 km", rounded the way a driver would say it.
export const distanceText = (m: number) =>
  m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`;
