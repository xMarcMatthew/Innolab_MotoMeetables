import type { VehicleType } from "@/lib/api/coop";
import { supabase } from "@/lib/supabase";

export type VehicleStatus = "off_duty" | "loading" | "departed";

export type MyVehicle = {
  id: string;
  plate: string;
  vehicle_type: VehicleType;
  status: VehicleStatus;
  driver_fare: number | null;
  route: {
    destination_name: string;
    guide_fare_regular: number;
    guide_fare_discounted: number | null;
    terminal: { name: string };
  } | null;
};

// The signed-in driver's vehicle, or null when the coop has not assigned one yet.
export async function getMyVehicle(): Promise<MyVehicle | null> {
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      "id, plate, vehicle_type, status, driver_fare, route:routes(destination_name, guide_fare_regular, guide_fare_discounted, terminal:terminals(name))",
    )
    .eq("driver_id", auth.session.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as MyVehicle | null;
}

// Both RPCs find the vehicle from auth.uid() and validate the value themselves.
export async function setStatus(status: VehicleStatus) {
  const { error } = await supabase.rpc("set_vehicle_status", { p_status: status });
  if (error) throw new Error(error.message);
}

export async function setFare(fare: number) {
  const { error } = await supabase.rpc("set_my_fare", { p_fare: fare });
  if (error) throw new Error(error.message);
}
