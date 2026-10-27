import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { LatLng } from "@/lib/api/commuter";
import { getMyDropPointsToday, getPassengersToday } from "@/lib/api/driver";
import { supabase } from "@/lib/supabase";

// Refreshed while the tab is open (drivers cannot read boardings, so no Realtime). Same rate as the GPS task.
const REFRESH_MS = 5000;

/** Today's passenger count, the drop points still ahead, and the vehicle's own last shared position. */
export function useDriverToday(vehicleId: string | undefined) {
  const [passengers, setPassengers] = useState<number | null>(null);
  const [dropPoints, setDropPoints] = useState<LatLng[]>([]);
  const [position, setPosition] = useState<LatLng | null>(null);

  useFocusEffect(
    useCallback(() => {
      const refresh = () => {
        // Each read keeps its last value when it fails, so a dropped request never blanks the card.
        getPassengersToday()
          .then(setPassengers)
          .catch(() => {});
        getMyDropPointsToday()
          .then(setDropPoints)
          .catch(() => {});
        if (vehicleId) {
          supabase
            .from("vehicle_positions")
            .select("lat, lng")
            .eq("vehicle_id", vehicleId)
            .maybeSingle()
            .then(({ data }) => data && setPosition({ lat: data.lat, lng: data.lng }));
        }
      };
      refresh();
      const timer = setInterval(refresh, REFRESH_MS);
      return () => clearInterval(timer);
    }, [vehicleId]),
  );

  return { passengers, dropPoints, position };
}
