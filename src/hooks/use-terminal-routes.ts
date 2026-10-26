import { useCallback, useEffect, useState } from "react";

import { listRoutes, type Route } from "@/lib/api/coop";

export function useTerminalRoutes(terminalId: string) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      listRoutes(terminalId)
        .then((r) => {
          setRoutes(r);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [terminalId],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { routes, loading, error, reload };
}
