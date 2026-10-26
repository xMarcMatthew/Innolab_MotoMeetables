import { useCallback, useEffect, useState } from "react";

import { getMyLocation } from "@/lib/my-location";
import { type LatLng, listRideOptions, type RideOption } from "@/lib/api/commuter";

export function useRideOptions(lat: number, lng: number) {
  const [options, setOptions] = useState<RideOption[]>([]);
  const [me, setMe] = useState<LatLng>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      getMyLocation()
        .then(async (here) => {
          setOptions(await listRideOptions({ lat, lng }, here));
          setMe(here);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [lat, lng],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Try again shows the spinner; the first load starts with it already on.
  const reload = () => {
    setLoading(true);
    load();
  };

  return { options, me, loading, error, reload };
}
