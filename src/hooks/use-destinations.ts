import { useCallback, useEffect, useState } from "react";

import { type Destination, listDestinations } from "@/lib/api/commuter";

// Home's data: destination names for the search box.
export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      listDestinations()
        .then((d) => {
          setDestinations(d);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { destinations, loading, error, reload };
}
