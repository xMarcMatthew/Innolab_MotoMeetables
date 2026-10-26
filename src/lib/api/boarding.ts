import type { LatLng } from "@/lib/api/commuter";
import { supabase } from "@/lib/supabase";

// board_vehicle checks the role, the 100 m distance and the 10 min repeat, and its error messages are
// written to show as is. Returns the plate for the confirmation, or null if only that read failed.
export async function boardVehicle(token: string, at: LatLng): Promise<string | null> {
  const { data: vehicleId, error } = await supabase.rpc("board_vehicle", {
    p_token: token,
    p_lat: at.lat,
    p_lng: at.lng,
  });
  if (error) throw new Error(error.message);
  const { data } = await supabase
    .from("vehicles")
    .select("plate")
    .eq("id", vehicleId)
    .maybeSingle();
  return data?.plate ?? null; // the boarding is already saved, so a failed plate read is not an error
}
