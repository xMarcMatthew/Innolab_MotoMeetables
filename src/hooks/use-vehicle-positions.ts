import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import {
  listLiveVehicles,
  type LivePosition,
  type LiveVehicleInfo,
  STALE_MS,
} from "@/lib/api/live";
import { supabase } from "@/lib/supabase";

export type LiveVehicle = LiveVehicleInfo & { lat: number; lng: number };

// Freshness uses the time the phone received each fix, not the server timestamp: no parsing, no clock skew.
type Seen = LivePosition & { seenAt: number };

/** Live vehicles on these routes: loads once, then follows Realtime; hides any vehicle silent for 15 s. */
export function useVehiclePositions(routeIds: string[]): LiveVehicle[] {
  const key = routeIds.join(",");
  const [vehicles, setVehicles] = useState(new Map<string, LiveVehicleInfo>());
  const [positions, setPositions] = useState(new Map<string, Seen>());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let channel: RealtimeChannel | undefined;

    listLiveVehicles(key.split(","))
      .then(({ vehicles: list, positions: fresh }) => {
        if (cancelled || list.length === 0) return;
        const seenAt = Date.now();
        setVehicles(new Map(list.map((v) => [v.id, v])));
        setPositions(new Map(fresh.map((p) => [p.vehicle_id, { ...p, seenAt }])));

        const ids = `in.(${list.map((v) => v.id).join(",")})`; // Realtime allows up to 100 values
        channel = supabase
          .channel(`live-vehicles:${key}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "vehicle_positions",
              filter: `vehicle_id=${ids}`,
            },
            ({ new: row }) => {
              const p = row as Partial<LivePosition>;
              if (!p.vehicle_id || p.lat == null || p.lng == null) return; // a delete has no new row
              const fix = { vehicle_id: p.vehicle_id, lat: p.lat, lng: p.lng, seenAt: Date.now() };
              setPositions((m) => new Map(m).set(fix.vehicle_id, fix));
            },
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "vehicles", filter: `id=${ids}` },
            ({ new: row }) => {
              const v = row as LiveVehicleInfo;
              setVehicles((m) =>
                new Map(m).set(v.id, { id: v.id, plate: v.plate, status: v.status }),
              );
            },
          )
          .subscribe();
      })
      // shortcut: no markers when the first load fails; the route screen itself still works. Retry on a later visit.
      .catch((e: Error) => console.warn("live vehicles:", e.message));

    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      cancelled = true;
      clearInterval(tick);
      if (channel) supabase.removeChannel(channel);
    };
  }, [key]);

  return [...positions.values()].flatMap((p) => {
    const v = vehicles.get(p.vehicle_id);
    return v && now - p.seenAt < STALE_MS ? [{ ...v, lat: p.lat, lng: p.lng }] : [];
  });
}
