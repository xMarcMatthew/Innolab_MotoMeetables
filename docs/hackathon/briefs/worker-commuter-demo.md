# Worker Commuter brief: place search, the Home pin, the fare to your drop point, scan sends the destination

You are changing the commuter screens of **Larga**, a Naga City terminal commute app (Expo SDK 56, Expo Router, NativeWind 4, Supabase, Mapbox via `@rnmapbox/maps`). Read this whole file, then `docs/hackathon/plan-matt-demo.md` (all of it; items 1, 2, 4, 6 and the scan part of 5 are yours), then every file in the ownership list below before editing it. This file is your whole brief; the plan explains the why.

## Ground rules
- **Own only these files**: `src/app/commuter/(home)/index.tsx`, `src/app/commuter/(home)/options.tsx`, `src/app/commuter/(home)/route.tsx`, `src/hooks/use-destinations.ts`, `src/lib/api/commuter.ts`, `src/components/commuter/ride-lines.tsx`, `src/components/scan-to-board.tsx`, `src/lib/api/boarding.ts`.
- **Never edit** anything else: not `src/app/driver/*`, `src/lib/api/driver.ts`, `src/components/live-vehicles.tsx`, `src/components/coop/*`, `src/lib/saved-trips.ts`, `src/lib/my-location.ts`, `src/lib/colors.ts`, layouts, `package.json`, `.env`, `supabase/`. Another worker is editing the driver files and the database at the same time.
- **No new packages, no native modules.** `fetch` is built in.
- **No git commits.** Leave changes in the working tree.
- Finish with `npx.cmd tsc --noEmit` (exit 0) and `npm run lint` (clean). Then append a `## Report` section at the bottom of this file (built, not verified, anything the integrator must know; under 15 lines).

## Database contract (migration 8 is being written by another worker; build against it)

`nearest_routes` keeps its current columns and appends: `drop_lat`, `drop_lng` (the point on the route line nearest the pin), `drop_km` (along the line from the terminal, null without a line), `fare_regular`, `fare_discounted` (fare from the terminal to the drop point; for a tricycle or a route without a line these equal the route's guide fares). **Until JM pushes the migration the live database returns none of these**, so read each with `?? null` and make every screen work when they are null (then it shows exactly what it shows today).

`board_vehicle` gains two optional arguments: `p_dest_lat`, `p_dest_lng` (both or neither). Pass them from the scan. Its error messages are still ready to show as is.

## What to build

### 1. Home, `src/app/commuter/(home)/index.tsx` and `src/hooks/use-destinations.ts`, `src/lib/api/commuter.ts`
- **Remove the terminal dots**: the `terminals` state, `dots`, `bounds`, the `terminals` ShapeSource and `listTerminals` (it has no other caller; delete it from `commuter.ts` and the hook). The camera opens on `NAGA` at zoom 12 with `defaultSettings` only.
- **One pin instead**: state `pin: { lat, lng, name } | null`. One `ShapeSource id="pin"` with a `CircleLayer` (accent fill, `colors.white` stroke, as `PinPicker` draws it). Set it two ways:
  - **Tap the map**: `MapView onPress` (see `src/components/coop/pin-picker.tsx` for the exact handler) sets the pin with `name = UNNAMED_PIN` (import it from `@/lib/saved-trips`).
  - **Pick a search result** (below) sets the pin to that place and moves the camera there (`camera.current?.setCamera({ centerCoordinate, zoomLevel: 15, animationDuration: 600 })`), puts the place name in the search box and hides the result list until the text changes again.
- **A card under the pin** (bottom of the screen, above the Near me button, only when a pin exists): the place name (or "Pinned spot") on one line, then a `Button` (from `@/components/ui/button`, primary) labelled **Show rides** that does `router.push({ pathname: "/commuter/options", params: { lat, lng, ...(name !== UNNAMED_PIN && { label: name }) } })`, exactly the params Options reads today. With no pin, show a one-line muted hint instead: "Search a place or tap the map".
- **Drop a pin and the pin mode go**: delete `pinMode`, the `PinPicker` import and the whole `if (pinMode)` branch and the "Drop a pin" button. `PinPicker` itself stays (the coop screens use it).
- **Near me becomes a round icon-only button**: bottom-right, `size-12 rounded-full` (48 px), the same `crosshairs-gps` icon, `accessibilityRole="button"`, `accessibilityLabel="Near me"`, border and white background as now. Same `nearMe` function.
- **Place search**: add `searchPlaces(query: string): Promise<Destination[]>` to `commuter.ts`:
  ```
  https://api.mapbox.com/search/searchbox/v1/forward?q=<encoded>&proximity=123.1948,13.6218&country=ph&limit=5&language=en&access_token=<process.env.EXPO_PUBLIC_MAPBOX_TOKEN>
  ```
  The response is a GeoJSON FeatureCollection; each feature has `geometry.coordinates` as `[lng, lat]` and `properties.name`, `properties.place_formatted`. Treat it as untrusted: keep only features whose name is a non-empty string and whose coordinates are finite numbers in range; cap the name at 120 characters. Give `Destination` an optional `detail?: string` (from `place_formatted`) so the list can show "Naga City Sports Complex" with "Naga City, 4400, Philippines" under it in `text-muted` (Search Box returns the Pili and Iriga sports complexes too). On a non-OK response throw with a short message.
  - In Home: debounce the typed text (about 300 ms, 3 or more characters; an `AbortController` or a request counter so a slow reply cannot overwrite a newer one). The list shows **our destination-name matches first** (the current `includes` filter) **then the Mapbox results**, skipping a Mapbox result whose name equals one of ours. Under 3 characters, only our names. Picking any row sets the pin as above (no navigation yet).
  - While the Mapbox call is pending and nothing matches yet: "Searching...". When the call fails: keep our matches and add one muted line "Place search is unavailable right now". When nothing at all matches: `No place called "<text>" found. Tap the map instead.`
  - Placeholder becomes "Where to? e.g. Sports complex".
- Keep `QuickTrips` where it is (its chips still push to Options directly; that is fine).

### 2. Options, `src/app/commuter/(home)/options.tsx`, and `src/components/commuter/ride-lines.tsx`
- Extend `RideOption` in `commuter.ts` with `dropPoint: LatLng | null`, `dropKm: number | null`, `fareRegular: number | null`, `fareDiscounted: number | null`, mapped from the new columns with `?? null`. `NearestRoute` gets the five optional fields.
- `FareLines` takes `{ option, place }`. When `fareRegular` is not null, the **headline** is the fare to the drop point in `text-2xl font-bold text-foreground`: `Fare to {place} ₱16.00`, with a second line in `text-muted`: `₱12.80 discounted · 5.0 km` (`dropKm.toFixed(1)` km, omitted when null). Below it, today's lines, reworded: `Full-route guide ₱24.20 (₱19.36 discounted)`, then the driver's fare and "Above the official fare" exactly as now (the driver's fare is for the whole route, so it stays compared with the full-route guide, never with the drop fare). When `fareRegular` is null, render exactly what `FareLines` renders today.
- Delete the footer "Fares are the official guide for the whole route, even if you get off earlier" and its `shortcut:` comment.
- Pass `label` through to Route: add `label` to the params of the `router.push` to `/commuter/route`.
- Use "your pin" as `place` when there is no label, as the screen already does.

### 3. Route, `src/app/commuter/(home)/route.tsx`
- Read the new `label` param; `place = label ?? "your pin"`. `FareLines` gets `place`.
- Draw the drop point on the map when `route.dropPoint` is not null: one more point feature `kind: "drop"` with a `CircleLayer` (secondary color) **and** a `SymbolLayer` text label "Get off here" (copy the label style from `src/components/live-vehicles.tsx`), so it is never color alone.
- `<ScanToBoard destination={{ lat: Number(lat), lng: Number(lng) }} place={place} />`.

### 4. Scan sends the destination, `src/components/scan-to-board.tsx` and `src/lib/api/boarding.ts`
- `boardVehicle(token, at, destination)` adds `p_dest_lat`, `p_dest_lng` to the RPC call.
- `ScanToBoard` takes `{ destination: LatLng; place: string }` and passes them on. The boarded text becomes `Boarded {plate}` on one line and `Getting off near {place}` in `text-muted` under it. Nothing else in the component changes.

## Quality bar
- Touch targets at least 48 dp; every `Pressable` has `accessibilityRole="button"` and pressed feedback; statuses and fares always carry a text label, never color alone. NativeWind classes only (`bg-background`, `text-foreground`, `text-muted`, `bg-primary`, `bg-accent`, `border-border`, `text-destructive`); hex only through `colors` from `@/lib/colors` in Mapbox layer props.
- Smallest change that does the job: no new abstractions, no state library, no options nobody asked for. Reuse `Button`, `Card`, `EmptyState`, `LoadingState` from `src/components/ui/` where a screen already uses them or where you touch that spot anyway.
- Any shortcut with a known limit gets a one-line comment: `shortcut: <limit>, <when to upgrade>`.
- Remove imports and helpers your change made unused; leave everything else as it is.

## Report
(append here when done)

**Worker Commuter, Oct 27.** `npx.cmd tsc --noEmit` exit 0, `npm run lint` clean, Prettier-clean. Only the 8 owned files changed; no packages, no commits.
- **Built:** items 1 to 4 as briefed. Home: no terminal dots or `listTerminals`; one accent pin from a search pick or a map tap; a card with the name and **Show rides**, or the hint "Search a place or tap the map"; round 48 px Near me, bottom-right under the card. `searchPlaces` (Search Box, untrusted reply checked, names capped at 120) with a 300 ms debounce, a stale-reply guard, our names first, and the Searching / unavailable / "No place called" lines. Options and Route: `FareLines({ option, place })` with the drop-fare headline, the "Full-route guide" line and the footer removed; `label` goes on to Route; the drop point is drawn with a "Get off here" label. Scan to board sends `p_dest_lat` and `p_dest_lng` and shows "Getting off near {place}".
- **Additions beyond the brief:** a map tap or a pick also closes the list and the keyboard, so the card shows. The muted detail line strips a leading `"undefined, "`, because Mapbox really returns "undefined, Pili, 4418, Philippines" (checked with one live request: "Sports complex" puts Naga City Sports Complex at 13.6467, 123.2369 first).
- **Integrator, must know:** **Scan to board fails until migration 8 is live.** PostgREST cannot find a `board_vehicle` that takes `p_dest_*`, so push migration 8 before or with this change. Every `nearest_routes` field is read with `?? null`, so Options and Route look as they do today until then.
- **Not verified:** nothing has been run on a phone: the Home pin and card layout, the camera move, the drop-point label, or the fare headline against real migration 8 data. When Home has a pin and the search list is open at once, the bottom card can sit under the keyboard until a pick or a map tap closes it.
