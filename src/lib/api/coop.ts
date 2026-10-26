import { supabase } from "@/lib/supabase";

export type Terminal = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type TerminalInput = { name: string; lat: number; lng: number };

// The caller's own profiles row holds coop_id. Read only; RLS checks it again on every write.
async function getMyCoopId(): Promise<string> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("profiles")
    .select("coop_id")
    .eq("id", auth.session.user.id)
    .single();
  if (error) throw new Error(error.message);
  if (!data.coop_id) throw new Error("Your account is not linked to a coop yet. Ask JM.");
  return data.coop_id;
}

// Terminals are readable by everyone, so filter to the caller's coop.
export async function listMyTerminals(): Promise<Terminal[]> {
  const coopId = await getMyCoopId();
  const { data, error } = await supabase
    .from("terminals")
    .select("id, name, lat, lng")
    .eq("coop_id", coopId)
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createTerminal(input: TerminalInput) {
  const coop_id = await getMyCoopId();
  const { error } = await supabase.from("terminals").insert({ coop_id, ...input });
  if (error) throw new Error(error.message);
}

export type VehicleType = "jeepney" | "tricycle" | "bus";

export type Route = {
  id: string;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  vehicle_type: VehicleType;
  guide_fare_regular: number;
  guide_fare_discounted: number | null;
};

export type RouteInput = Omit<Route, "id">;

export async function listRoutes(terminalId: string): Promise<Route[]> {
  const { data, error } = await supabase
    .from("routes")
    .select(
      "id, destination_name, destination_lat, destination_lng, vehicle_type, guide_fare_regular, guide_fare_discounted",
    )
    .eq("terminal_id", terminalId)
    .order("destination_name");
  if (error) throw new Error(error.message);
  return data as Route[];
}

// RLS accepts the insert only when the terminal belongs to the caller's coop. route_line is never sent.
export async function createRoute(terminalId: string, input: RouteInput) {
  const { error } = await supabase.from("routes").insert({ terminal_id: terminalId, ...input });
  if (error) throw new Error(error.message);
}

export async function updateRoute(id: string, input: RouteInput) {
  const { data, error } = await supabase.from("routes").update(input).eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("Route not found or not yours to edit");
}

// RLS only lets a coop update its own rows; another coop's id matches nothing.
export async function updateTerminal(id: string, input: TerminalInput) {
  const { data, error } = await supabase.from("terminals").update(input).eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("Terminal not found or not yours to edit");
}

export type VehicleStatus = "off_duty" | "loading" | "departed";

export type Vehicle = {
  id: string;
  plate: string;
  vehicle_type: VehicleType;
  status: VehicleStatus;
  route_id: string | null;
  driver_id: string | null;
  route: { destination_name: string; terminal: { name: string } } | null;
  driver: { full_name: string | null } | null;
};

export type VehicleInput = {
  plate: string;
  vehicle_type: VehicleType;
  route_id: string | null;
  driver_id: string | null;
};

// A route of this coop's terminals, for the vehicle form's route picker.
export type CoopRoute = {
  id: string;
  destination_name: string;
  vehicle_type: VehicleType;
  terminal_name: string;
};

export type Driver = { id: string; full_name: string | null };

// Plate and driver_id are the only unique columns; the constraint name in the message says which one clashed.
function vehicleError(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    if (error.message.includes("plate")) return new Error("That plate is already registered");
    if (error.message.includes("driver_id")) return new Error("That driver already has a vehicle");
  }
  return new Error(error.message);
}

export async function listMyVehicles(): Promise<Vehicle[]> {
  const coopId = await getMyCoopId();
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, plate, vehicle_type, status, route_id, driver_id, route:routes(destination_name, terminal:terminals(name)), driver:profiles(full_name)",
    )
    .eq("coop_id", coopId)
    .order("plate");
  if (error) throw new Error(error.message);
  return data as unknown as Vehicle[];
}

export async function listMyRoutes(): Promise<CoopRoute[]> {
  const coopId = await getMyCoopId();
  const { data, error } = await supabase
    .from("routes")
    .select("id, destination_name, vehicle_type, terminals!inner(name, coop_id)")
    .eq("terminals.coop_id", coopId)
    .order("destination_name");
  if (error) throw new Error(error.message);
  return (
    data as unknown as (Omit<CoopRoute, "terminal_name"> & { terminals: { name: string } })[]
  ).map(({ terminals, ...r }) => ({ ...r, terminal_name: terminals.name }));
}

// RLS lets a coop user read only the drivers of their own coop.
export async function listMyDrivers(): Promise<Driver[]> {
  const coopId = await getMyCoopId();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "driver")
    .eq("coop_id", coopId)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createVehicle(input: VehicleInput) {
  const coop_id = await getMyCoopId();
  const { error } = await supabase.from("vehicles").insert({ coop_id, ...input });
  if (error) throw vehicleError(error);
}

export async function updateVehicle(id: string, input: VehicleInput) {
  const { data, error } = await supabase.from("vehicles").update(input).eq("id", id).select("id");
  if (error) throw vehicleError(error);
  if (data.length === 0) throw new Error("Vehicle not found or not yours to edit");
}

// Dispatcher override: a plain update under RLS, not the driver's set_vehicle_status RPC.
export async function setVehicleStatusAsCoop(id: string, status: VehicleStatus) {
  const { data, error } = await supabase
    .from("vehicles")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new Error("Vehicle not found or not yours to edit");
}
