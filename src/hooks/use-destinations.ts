import { useCallback, useEffect, useState } from "react";

import { type Destination, listDestinations, listTerminals } from "@/lib/api/commuter";
import type { Terminal } from "@/lib/api/coop";

// Home's data: destination names for the search box and terminals for the map dots.
export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      Promise.all([listDestinations(), listTerminals()])
        .then(([d, t]) => {
          setDestinations(d);
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

  return { destinations, terminals, loading, error, reload };
}
