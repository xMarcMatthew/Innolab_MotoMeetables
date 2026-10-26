import AsyncStorage from "@react-native-async-storage/async-storage";

// Quick trips: destinations the commuter picked, kept on this phone only (no account id, nothing sent anywhere).
// A "trip" is the destination, not a ride: real ride history does not exist yet.
const KEY = "larga.savedTrips";
const MAX_TRIPS = 50;
const MAX_NAME = 120;
export const UNNAMED_PIN = "Pinned spot";

export type SavedTrip = {
  name: string;
  lat: number;
  lng: number;
  count: number;
  lastUsed: number; // ms since epoch
  pinned: boolean;
};

// The same place merges: name plus lat and lng rounded to 4 decimals (about 11 m).
const keyOf = (t: Pick<SavedTrip, "name" | "lat" | "lng">) =>
  `${t.name}|${t.lat.toFixed(4)}|${t.lng.toFixed(4)}`;

// Whatever is in storage is untrusted: drop malformed entries and out-of-range coordinates.
function parse(raw: string | null): SavedTrip[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const trips: SavedTrip[] = [];
  for (const e of data) {
    if (typeof e !== "object" || e === null) continue;
    const { name, lat, lng, count, lastUsed, pinned } = e as Record<string, unknown>;
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      name.length > MAX_NAME ||
      typeof lat !== "number" ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      typeof lng !== "number" ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180 ||
      typeof count !== "number" ||
      !Number.isInteger(count) ||
      count < 1 ||
      typeof lastUsed !== "number" ||
      !Number.isFinite(lastUsed)
    ) {
      continue;
    }
    trips.push({ name, lat, lng, count, lastUsed, pinned: pinned === true });
  }
  return trips;
}

async function load(): Promise<SavedTrip[]> {
  try {
    return parse(await AsyncStorage.getItem(KEY));
  } catch {
    return [];
  }
}

// A lost write only means a destination is not remembered, so it never blocks navigation.
async function save(trips: SavedTrip[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(trips));
  } catch {}
}

// Read-modify-write steps run one after another, so a pick and a star tap cannot overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
function update(change: (trips: SavedTrip[]) => SavedTrip[]): Promise<void> {
  const step = queue.then(async () => save(change(await load())));
  queue = step.catch(() => {});
  return step;
}

// Over the cap, the oldest unpinned trips go first (the oldest pinned only if everything is pinned).
function trim(trips: SavedTrip[]): SavedTrip[] {
  if (trips.length <= MAX_TRIPS) return trips;
  const byAge = [...trips].sort((a, b) => a.lastUsed - b.lastUsed);
  const drop = new Set<SavedTrip>();
  for (const t of byAge.filter((t) => !t.pinned).concat(byAge.filter((t) => t.pinned))) {
    if (trips.length - drop.size <= MAX_TRIPS) break;
    drop.add(t);
  }
  return trips.filter((t) => !drop.has(t));
}

export function recordPick(place: { name?: string; lat: number; lng: number }): Promise<void> {
  const name = (place.name?.trim() || UNNAMED_PIN).slice(0, MAX_NAME);
  const { lat, lng } = place;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Promise.resolve();
  }
  return update((trips) => {
    const key = keyOf({ name, lat, lng });
    const existing = trips.find((t) => keyOf(t) === key);
    if (existing) {
      return trips.map((t) =>
        t === existing ? { ...t, count: t.count + 1, lastUsed: Date.now() } : t,
      );
    }
    return trim([...trips, { name, lat, lng, count: 1, lastUsed: Date.now(), pinned: false }]);
  });
}

export function togglePin(trip: SavedTrip): Promise<void> {
  const key = keyOf(trip);
  return update((trips) => trips.map((t) => (keyOf(t) === key ? { ...t, pinned: !t.pinned } : t)));
}

export function removeTrip(trip: SavedTrip): Promise<void> {
  const key = keyOf(trip);
  return update((trips) => trips.filter((t) => keyOf(t) !== key));
}

// Pinned first, then frequent (picked twice or more, most used first), then recent. Each trip appears once.
export function rank(trips: SavedTrip[], limit: number): SavedTrip[] {
  const latest = (a: SavedTrip, b: SavedTrip) => b.lastUsed - a.lastUsed;
  const pinned = trips.filter((t) => t.pinned).sort(latest);
  const frequent = trips
    .filter((t) => !t.pinned && t.count >= 2)
    .sort((a, b) => b.count - a.count || latest(a, b));
  const recent = trips.filter((t) => !t.pinned && t.count < 2).sort(latest);
  return [...pinned, ...frequent, ...recent].slice(0, limit);
}

export async function getSuggestions(limit = 3): Promise<SavedTrip[]> {
  return rank(await load(), limit);
}
