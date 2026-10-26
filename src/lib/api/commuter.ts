import type { LineString } from "geojson";

import type { Terminal, VehicleType } from "@/lib/api/coop";
import type { VehicleStatus } from "@/lib/api/driver";
import { supabase } from "@/lib/supabase";

// Commuter reads: the nearest_routes RPC (migrations 2 and 4), routes and vehicles under RLS. No writes.

export type LatLng = { lat: number; lng: number };

export type Destination = { name: string; lat: number; lng: number };

// One row of nearest_routes plus the vehicle reads for that route.
export type RideOption = {
  routeId: string;
  destinationName: string;
  vehicleType: VehicleType;
  terminal: { id: string; name: string; lat: number; lng: number };
  guideFareRegular: number | null;
  guideFareDiscounted: number | null;
  dropMetres: number; // pin to the nearest point of the route line
  terminalMetres: number | null; // commuter to the terminal; null without their location
  loadingCount: number; // vehicles on this route with status 'loading'
  driverFare: number | null; // a loading vehicle's driver_fare, if any
};

export type RouteDetail = RideOption & { line: LineString | null };

// Columns returned by the nearest_routes RPC (migration 4).
type NearestRoute = {
  route_id: string;
  destination_name: string;
  vehicle_type: VehicleType;
  terminal_id: string;
  terminal_name: string;
  terminal_lat: number;
  terminal_lng: number;
  guide_fare_regular: number | null;
  guide_fare_discounted: number | null;
  drop_m: number;
  terminal_m: number | null;
};

// Past this, the route leaves you too far to walk: the screen says "No terminal serves that spot yet".
const MAX_DROP_METRES = 2000;

/** Distinct destination names with their points, for the name search. */
export async function listDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase
    .from("routes")
    .select("destination_name, destination_lat, destination_lng")
    .order("destination_name");
  if (error) throw new Error(error.message);
  // Routes from several terminals or jeep types share a name; the first point per name is enough as a pin.
  const byName = new Map<string, Destination>();
  for (const r of data) {
    if (!byName.has(r.destination_name)) {
      byName.set(r.destination_name, {
        name: r.destination_name,
        lat: r.destination_lat,
        lng: r.destination_lng,
      });
    }
  }
  return [...byName.values()];
}

/** Every terminal, for the dots on the Home map. */
export async function listTerminals(): Promise<Terminal[]> {
  const { data, error } = await supabase.from("terminals").select("id, name, lat, lng");
  if (error) throw new Error(error.message);
  return data;
}

/** nearest_routes for a pin (or a chosen destination's point), plus vehicle counts and fares. */
export async function listRideOptions(pin: LatLng, me?: LatLng): Promise<RideOption[]> {
  // me is all or nothing, as the RPC requires; undefined keys are left out of the request.
  const { data, error } = await supabase.rpc("nearest_routes", {
    p_dest_lat: pin.lat,
    p_dest_lng: pin.lng,
    p_my_lat: me?.lat,
    p_my_lng: me?.lng,
  });
  if (error) throw new Error(error.message);
  // The database already sorts by drop distance, then terminal distance; keep its order.
  const rows = (data as NearestRoute[]).filter((r) => r.drop_m <= MAX_DROP_METRES);
  if (rows.length === 0) return [];

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("route_id, status, driver_fare")
    .in(
      "route_id",
      rows.map((r) => r.route_id),
    );
  if (vehiclesError) throw new Error(vehiclesError.message);

  return rows.map((r) => {
    const loading = (
      vehicles as { route_id: string; status: VehicleStatus; driver_fare: number | null }[]
    ).filter((v) => v.route_id === r.route_id && v.status === "loading");
    const fares = loading.flatMap((v) => (v.driver_fare === null ? [] : [v.driver_fare]));
    return {
      routeId: r.route_id,
      destinationName: r.destination_name,
      vehicleType: r.vehicle_type,
      terminal: {
        id: r.terminal_id,
        name: r.terminal_name,
        lat: r.terminal_lat,
        lng: r.terminal_lng,
      },
      guideFareRegular: r.guide_fare_regular,
      guideFareDiscounted: r.guide_fare_discounted,
      dropMetres: r.drop_m,
      terminalMetres: r.terminal_m,
      loadingCount: loading.length,
      // The highest of the loading fares, so a cheaper jeep never hides "Above the official fare".
      driverFare: fares.length > 0 ? Math.max(...fares) : null,
    };
  });
}

/** One route with its line, for the Route screen. */
export async function getRouteDetail(
  routeId: string,
  pin: LatLng,
  me?: LatLng,
): Promise<RouteDetail> {
  const [options, { data, error }] = await Promise.all([
    listRideOptions(pin, me),
    supabase.from("routes").select("route_line").eq("id", routeId).maybeSingle(),
  ]);
  if (error) throw new Error(error.message);
  const option = options.find((o) => o.routeId === routeId);
  if (!option || !data) throw new Error("This ride is no longer listed. Go back and search again.");
  return { ...option, line: data.route_line };
}
