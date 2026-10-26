import { useCallback, useEffect, useState } from "react";

import { getRouteDetail, type RouteDetail } from "@/lib/api/commuter";

// Numbers, not objects, so the screen's params never retrigger the load by identity alone.
export function useRouteDetail(
  routeId: string,
  lat: number,
  lng: number,
  myLat?: number,
  myLng?: number,
) {
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      getRouteDetail(
        routeId,
        { lat, lng },
        myLat !== undefined && myLng !== undefined ? { lat: myLat, lng: myLng } : undefined,
      )
        .then((r) => {
          setRoute(r);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [routeId, lat, lng, myLat, myLng],
  );

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    setLoading(true);
    load();
  };

  return { route, loading, error, reload };
}
