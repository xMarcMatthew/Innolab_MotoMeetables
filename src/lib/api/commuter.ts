import type { LineString } from "geojson";

import type { VehicleType } from "@/lib/api/coop";

// Shared shapes for the commuter screens. Worker A fills the function bodies against Supabase
// (nearest_routes RPC, routes, vehicles); keep these names and types so the screens and hooks agree.

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

/** Distinct destination names with their points, for the name search. */
export async function listDestinations(): Promise<Destination[]> {
  throw new Error(
    "TODO Worker A: distinct destination_name, destination_lat, destination_lng from routes",
  );
}

/** nearest_routes for a pin (or a chosen destination's point), plus vehicle counts and fares. */
export async function listRideOptions(_pin: LatLng, _me?: LatLng): Promise<RideOption[]> {
  throw new Error("TODO Worker A: supabase.rpc('nearest_routes') then vehicles by route_id");
}

/** One route with its line, for the Route screen. */
export async function getRouteDetail(
  _routeId: string,
  _pin: LatLng,
  _me?: LatLng,
): Promise<RouteDetail> {
  throw new Error("TODO Worker A: the matching RideOption plus routes.route_line");
}
