import type { VehicleStatus } from "@/lib/api/driver";
import { supabase } from "@/lib/supabase";

export type LiveVehicleInfo = { id: string; plate: string; status: VehicleStatus };
export type LivePosition = { vehicle_id: string; lat: number; lng: number };

// A vehicle with no update for this long is hidden (tech-stack: 15 s staleness cutoff).
export const STALE_MS = 15_000;

/** The vehicles on these routes, plus the positions that are fresh right now. */
export async function listLiveVehicles(routeIds: string[]) {
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("id, plate, status")
    .in("route_id", routeIds);
  if (error) throw new Error(error.message);
  if (vehicles.length === 0) return { vehicles: [] as LiveVehicleInfo[], positions: [] };

  // The database compares the timestamps, so the phone never parses them.
  const { data: positions, error: positionsError } = await supabase
    .from("vehicle_positions")
    .select("vehicle_id, lat, lng")
    .in(
      "vehicle_id",
      vehicles.map((v) => v.id),
    )
    .gte("updated_at", new Date(Date.now() - STALE_MS).toISOString());
  if (positionsError) throw new Error(positionsError.message);

  return { vehicles: vehicles as LiveVehicleInfo[], positions: positions as LivePosition[] };
}
