import { useCallback, useEffect, useState } from "react";

import { listMyTerminals, type Terminal } from "@/lib/api/coop";

export function useMyTerminals() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      listMyTerminals()
        .then((t) => {
          setTerminals(t);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { terminals, loading, error, reload };
}
