# Worker Driver brief: a Map tab that shows where today's passengers get off

You are adding one tab to the driver screens of **Larga**, a Naga City terminal commute app (Expo SDK 56, Expo Router, NativeWind 4, Supabase, Mapbox via `@rnmapbox/maps`). Read this whole file, then `docs/hackathon/plan-matt-demo.md` (item 5 and "The flow we are building"), then every file in the ownership list and the files named under "Reuse" before editing. This file is your whole brief.

## Ground rules
- **Own only these files**: `src/app/driver/_layout.tsx`, new `src/app/driver/map.tsx`, `src/lib/api/driver.ts`, and if you need one, new `src/hooks/use-drop-points.ts`.
- **Never edit** anything else: not `src/app/commuter/*`, `src/lib/api/commuter.ts`, `src/components/live-vehicles.tsx`, `src/hooks/use-vehicle-positions.ts`, `src/components/ui/*`, `src/lib/colors.ts`, `src/app/_layout.tsx`, `package.json`, `.env`, `supabase/`. Another worker is editing the commuter files and the database at the same time.
- **No new packages, no native modules. No git commits.**
- Finish with `npx.cmd tsc --noEmit` (exit 0) and `npm run lint` (clean). Then append a `## Report` section at the bottom of this file (built, not verified, anything the integrator must know; under 15 lines).

## Database contract (migration 8 is being written by another worker; build against it)
- `my_drop_points_today()` is a new RPC: `supabase.rpc("my_drop_points_today")` returns `{ lat: number; lng: number }[]`, the points on the route where today's boarded passengers get off (points only, no ids, by design). Until JM pushes the migration, the call fails: the screen must show the map anyway and keep the last points, the way the QR tab keeps its last count (`.catch(() => {})`).
- Everything else you need already exists: `vehicles` (own row readable), `routes.route_line` (a bare GeoJSON `LineString` or null), `terminals`, and the live positions through `LiveVehicles`.

## Reuse (do not rewrite)
- `src/app/driver/qr.tsx`: the exact pattern for a tab that loads once and refreshes every 5 s while focused (`useFocusEffect` + `setInterval`), with `LoadingState`, `ErrorState`, `EmptyState`.
- `src/hooks/use-my-vehicle.ts` + `getMyVehicle` in `src/lib/api/driver.ts`: the driver's vehicle and route. **Extend the select** so `route` also carries `id`, `route_line` and `terminal(name, lat, lng)`; update the `MyVehicle` type accordingly (additive: `src/app/driver/index.tsx` keeps compiling without changes; run tsc to confirm).
- `src/app/commuter/(home)/route.tsx` (read only): how a map draws the route line, the terminal dot and the destination dot (last point of the line) and fits the camera to the line with padding, and the `Mapbox.setAccessToken` and `styleURL` setup. Copy that approach into `map.tsx`.
- `src/components/live-vehicles.tsx`: `<LiveVehicles routeIds={[route.id]} />` inside the `MapView` draws every live jeep on the route, the driver's own included, with plate and status labels. Also copy its `SymbolLayer` label style for the drop-point labels.
- `src/components/coop/vehicle-type-chips.tsx`: `VEHICLE_TYPE_LABELS` if you name the vehicle type.

## What to build

### `src/app/driver/_layout.tsx`
Add a `Tabs.Screen name="map"`, title **Map**, icon `map-marker-path` (MaterialCommunityIcons), between QR and Account. Tabs: Trip · QR · Map · Account.

### `src/lib/api/driver.ts`
- Extend `getMyVehicle` as above.
- Add `getMyDropPointsToday(): Promise<{ lat: number; lng: number }[]>` calling the RPC; throw on error like the other calls.

### `src/app/driver/map.tsx`
- `useMyVehicle()` for the vehicle and route. States: loading → `LoadingState`; error with nothing loaded → `ErrorState` with retry; no vehicle → `EmptyState` ("No vehicle assigned yet. Ask your coop to assign you one.", icon `map-marker-off`); vehicle without a route or a route without a line → `EmptyState` ("Your coop has not drawn this route yet.").
- Otherwise a full-screen `MapView` (custom style) with: the route line (primary, width 4), the terminal dot (accent) and destination dot (primary) as the Route screen draws them, `<LiveVehicles routeIds={[route.id]} />`, and a `ShapeSource id="drop-points"` with a `CircleLayer` (accent fill, white stroke) **and** a `SymbolLayer` text label **"Drop-off"** under each point (never color alone).
- Poll `getMyDropPointsToday` every 5 s while the tab is focused (QR tab pattern); keep the last points on a failed refresh.
- A caption over the bottom of the map in a white rounded box (respect the safe area): `3 passengers getting off today` / `1 passenger getting off today` / `No drop-offs yet. Passengers who scan your QR appear here.` Text only, no extra controls.
- Camera: fit the line with padding as the Route screen does.

## Quality bar
- Every `Pressable` (if any) has `accessibilityRole="button"` and a 48 dp target. NativeWind classes only; hex only through `colors` from `@/lib/colors` in Mapbox layer props.
- Smallest change that does the job: no new abstractions beyond what the QR tab already does. A small hook is fine only if it keeps `map.tsx` readable.
- Any shortcut with a known limit gets a one-line comment: `shortcut: <limit>, <when to upgrade>`.
- Leave every other file exactly as it is; put observations in the Report.

## Report
(append here when done)

**Built (Oct 27, worker chat):** `driver/_layout.tsx` gains the Map tab (Trip · QR · Map · Account, `map-marker-path`). `lib/api/driver.ts`: `getMyVehicle` now also selects `route.id`, `route_line` and `terminal(lat, lng)` (additive, `driver/index.tsx` unchanged); new `getMyDropPointsToday()` throws on error. New `driver/map.tsx`: route line, terminal and destination dots and camera fit copied from the commuter Route screen, `<LiveVehicles routeIds={[route.id]} />`, `ShapeSource id="drop-points"` with an accent `CircleLayer` plus a "Drop-off" `SymbolLayer` (LiveVehicles' label style), polled every 5 s while focused, last points kept on failure (`.catch(() => {})`), and the bottom caption in a white rounded box. No hook file: the poll is the QR tab's 8 lines inline.
- **Checks:** `npx.cmd tsc --noEmit` exit 0, `npm run lint` clean. **Not run on a phone**, and `my_drop_points_today` is not live yet, so today the caption always says "No drop-offs yet".
- **Small calls beyond the brief:** the no-vehicle `EmptyState` has a "Check again" action (`reload`), since tabs stay mounted and `useMyVehicle` loads only once; camera `paddingBottom` is 120 so the caption does not cover the line's end; hex `#FFFFFF` became `colors.white`.
- **Safe area:** no insets used. The tab bar already sits above the bottom inset and the tab header covers the top, so `bottom-4` matches the commuter Home's bottom row. Check on a gesture-nav phone.
- **Integrator:** the RPC result is cast, not validated; migration 8 must return rows shaped `{ lat, lng }` (numbers). The driver's vehicle and route load once per app session on this tab; a coop reassigning the route mid-shift shows after "Check again" only in the no-vehicle case, otherwise after an app restart.
- `npx prettier --check` flags `_layout.tsx` and `driver.ts` only for CRLF (Windows checkout, `core.autocrlf=true`); untouched `qr.tsx` flags the same, and git stores LF.
