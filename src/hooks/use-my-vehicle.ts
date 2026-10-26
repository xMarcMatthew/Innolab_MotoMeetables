import { useCallback, useEffect, useState } from "react";

import { getMyVehicle, type MyVehicle } from "@/lib/api/driver";

export function useMyVehicle() {
  const [vehicle, setVehicle] = useState<MyVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      getMyVehicle()
        .then((v) => {
          setVehicle(v);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { vehicle, loading, error, reload };
}
