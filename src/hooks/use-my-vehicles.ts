import { useCallback, useEffect, useState } from "react";

import { listMyVehicles, type Vehicle } from "@/lib/api/coop";

export function useMyVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      listMyVehicles()
        .then((v) => {
          setVehicles(v);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { vehicles, loading, error, reload };
}
