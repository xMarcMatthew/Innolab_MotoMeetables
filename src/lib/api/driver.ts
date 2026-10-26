import type { LineString } from "geojson";

import type { VehicleType } from "@/lib/api/coop";
import { supabase } from "@/lib/supabase";

export type VehicleStatus = "off_duty" | "loading" | "departed";

export type MyVehicle = {
  id: string;
  plate: string;
  vehicle_type: VehicleType;
  status: VehicleStatus;
  driver_fare: number | null;
  payment_qr: string | null;
  route: {
    id: string;
    destination_name: string;
    guide_fare_regular: number;
    guide_fare_discounted: number | null;
    route_line: LineString | null;
    terminal: { name: string; lat: number; lng: number };
  } | null;
};

// The signed-in driver's vehicle, or null when the coop has not assigned one yet.
export async function getMyVehicle(): Promise<MyVehicle | null> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, plate, vehicle_type, status, driver_fare, payment_qr, route:routes(id, destination_name, guide_fare_regular, guide_fare_discounted, route_line, terminal:terminals(name, lat, lng))",
    )
    .eq("driver_id", auth.session.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as MyVehicle | null;
}

// All three RPCs find the vehicle from auth.uid() and validate the value themselves.
export async function setStatus(status: VehicleStatus) {
  const { error } = await supabase.rpc("set_vehicle_status", { p_status: status });
  if (error) throw new Error(error.message);
}

export async function setFare(fare: number) {
  const { error } = await supabase.rpc("set_my_fare", { p_fare: fare });
  if (error) throw new Error(error.message);
}

// RLS returns only the signed-in driver's own token, so no filter is needed. null when no vehicle is assigned.
export async function getMyBoardQr(): Promise<{ board_token: string; plate: string } | null> {
  const { data, error } = await supabase
    .from("vehicle_tokens")
    .select("board_token, vehicle:vehicles(plate)")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const vehicle = data.vehicle as unknown as { plate: string };
  return { board_token: data.board_token, plate: vehicle.plate };
}

// Boardings on the driver's vehicle since midnight Manila time (count only, never who).
export async function getPassengersToday(): Promise<number> {
  const { data, error } = await supabase.rpc("my_passengers_today");
  if (error) throw new Error(error.message);
  return data as number;
}

// Where today's boarded passengers get off, snapped to the route line (points only, never who).
export async function getMyDropPointsToday(): Promise<{ lat: number; lng: number }[]> {
  const { data, error } = await supabase.rpc("my_drop_points_today");
  if (error) throw new Error(error.message);
  return data as { lat: number; lng: number }[];
}

// null removes the QR. The database checks the format; the app checks the CRC (isValidQrPh) before calling.
export async function setMyPaymentQr(qr: string | null) {
  const { error } = await supabase.rpc("set_my_payment_qr", { p_qr: qr });
  if (error) throw new Error(error.message);
}
