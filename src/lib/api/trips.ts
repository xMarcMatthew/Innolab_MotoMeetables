import type { VehicleType } from "@/lib/api/coop";
import { supabase } from "@/lib/supabase";

export type Trip = {
  id: string;
  boardedAt: Date;
  // null when the coop deleted the vehicle: the boarding row survives (migration 1).
  vehicle: {
    plate: string;
    vehicleType: VehicleType;
    terminalName: string | null;
    destinationName: string | null;
  } | null;
};

type Row = {
  id: string;
  boarded_at: string;
  vehicle: {
    plate: string;
    vehicle_type: VehicleType;
    route: { destination_name: string; terminal: { name: string } | null } | null;
  } | null;
};

// shortcut: the newest 100 rides only; add paging if a commuter ever scrolls past that.
const MAX_TRIPS = 100;

/** The commuter's own boardings, newest first. RLS returns only the caller's rows. */
export async function listMyTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("boardings")
    .select(
      "id, boarded_at, vehicle:vehicles(plate, vehicle_type, route:routes(destination_name, terminal:terminals(name)))",
    )
    .order("boarded_at", { ascending: false })
    .limit(MAX_TRIPS);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
    boardedAt: new Date(r.boarded_at),
    vehicle: r.vehicle && {
      plate: r.vehicle.plate,
      vehicleType: r.vehicle.vehicle_type,
      terminalName: r.vehicle.route?.terminal?.name ?? null,
      destinationName: r.vehicle.route?.destination_name ?? null,
    },
  }));
}
