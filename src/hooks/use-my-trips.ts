import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { listMyTrips, type Trip } from "@/lib/api/trips";

// Loads on every focus, so a scan made on the Route screen shows as soon as the commuter opens the tab.
export function useMyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      listMyTrips()
        .then((t) => {
          setTrips(t);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        }),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Pull to refresh keeps the list on screen; Try again shows the full-screen spinner.
  const refresh = () => {
    setRefreshing(true);
    load();
  };
  const retry = () => {
    setLoading(true);
    load();
  };

  return { trips, loading, refreshing, error, refresh, retry };
}
