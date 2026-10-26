# Worker A brief: commuter core (Home search, Options, Route)

You are building the commuter screens of **Larga**, a Naga City terminal commute app (Expo SDK 56, Expo Router, NativeWind 4, Supabase, Mapbox via `@rnmapbox/maps`). Read this whole file, then `docs/hackathon/plan-matt-nap.md`, then `docs/hackathon/tech-stack.md` (sections "Core flow" and "Data"). Do not read other chats; this file is your whole brief.

## Ground rules
- **Own only these files**: `src/app/commuter/(home)/index.tsx`, `src/app/commuter/(home)/options.tsx`, `src/app/commuter/(home)/route.tsx`, anything under `src/components/commuter/`, `src/hooks/use-destinations.ts`, `src/hooks/use-ride-options.ts`, `src/hooks/use-route-detail.ts`, and the **function bodies** in `src/lib/api/commuter.ts` (keep its exported types and function names; the skeleton's mock loader stays as the fallback).
- **Never edit**: `src/app/_layout.tsx`, `src/app/commuter/_layout.tsx`, `src/app/commuter/(home)/_layout.tsx`, `src/app/(auth)/*`, `src/app/waiting.tsx`, `src/app/index.tsx`, `src/app/commuter/trips.tsx`, `src/app/commuter/account.tsx`, anything under `src/app/driver/` or `src/app/coop/`, `src/lib/supabase.ts`, `package.json`, `app.json`, `.env`.
- **No new packages, no native modules.** Everything you need is installed.
- **No git commits.** Leave changes in the working tree. JM commits.
- Finish with `npx tsc --noEmit` (exit 0) and `npm run lint` (clean). If `npx` is refused in your shell, use `npx.cmd`.
- Append a `## Report` section to the bottom of this file: what you built, what is mocked, what you could not verify, and anything JM must know. Keep it under 15 lines.

## What exists (reuse, do not rewrite)
- Pattern: `src/lib/api/driver.ts` (queries) → `src/hooks/use-my-vehicle.ts` (load, reload, loading, error) → `src/app/driver/index.tsx` (screen). Copy this shape.
- `src/lib/api/commuter.ts`: exported types `Destination`, `RideOption`, `RouteDetail` and function signatures `listDestinations`, `listRideOptions`, `getRouteDetail` with `TODO` bodies. **Your job is the bodies**, against the live Supabase data (Rj's Naga seed is loaded: 12 terminals, 19 routes with `route_line`, 6 vehicles). No mock data.
- **The destination search is already a database function.** Call it for Options:
  ```ts
  const { data, error } = await supabase.rpc("nearest_routes", {
    p_dest_lat: pin.lat, p_dest_lng: pin.lng,
    p_my_lat: me?.lat, p_my_lng: me?.lng, // optional: send both or neither
  });
  ```
  It returns up to 10 rows, closest first: `route_id`, `destination_name`, `vehicle_type`, `terminal_id`, `terminal_name`, `terminal_lat`, `terminal_lng`, `guide_fare_regular`, `guide_fare_discounted`, `drop_m` (pin to the nearest point of the route line, metres) and `terminal_m` (you to the terminal, null without your location). It already skips routes whose terminal is at the pin and already sorts by drop distance then terminal distance. Do not re-sort. When every `drop_m` is large, show "drops you X km away"; treat over 2 km as "No terminal serves that spot yet".
- A **name search** is the same call: `listDestinations` reads distinct `destination_name` with `destination_lat`, `destination_lng` from `routes`; picking a name calls `nearest_routes` with that destination's point as the pin. One screen flow for both search and pin.
- Route lines and vehicle status are separate reads, as agreed with JM: `supabase.from("routes").select("id, route_line").in("id", ids)` and `supabase.from("vehicles").select("route_id, status, driver_fare, plate").in("route_id", ids)`. `route_line` is a bare GeoJSON `LineString`.
- `vehicle_type` is one of `jeepney`, `modern_jeepney`, `tricycle`, `bus`. Labels come from `VEHICLE_TYPE_LABELS` in `src/components/coop/vehicle-type-chips.tsx` ("Traditional jeepney", "Modern jeepney", ...). Do not invent your own labels.
- Known limit to show honestly: a jeep that passes the pin on its way elsewhere shows its full-route fare (a Carolina jeep through Pacol shows the Carolina fare). Show the fare as the official guide for the whole route; no per-stop fares.
- `src/lib/colors.ts`: Palette A hex values for places that cannot take class names (Mapbox layer styles, tab tint). Everywhere else use NativeWind classes: `bg-background`, `text-foreground`, `text-muted`, `bg-primary`, `bg-accent`, `border-border`, `text-destructive`. Never hex in className.
- `src/components/coop/pin-picker.tsx`: `PinPicker` takes `{ pin, onPick }` and renders a tappable map. Reuse it for "Drop a pin".
- `src/components/form-field.tsx`: labelled input with error. `src/lib/validation.ts`: Zod schemas. `src/components/sign-out-button.tsx`.
- The current map screen (moved to `src/app/commuter/(home)/index.tsx` by the skeleton) already shows a MapView on the custom style with a `ShapeSource`, `LineLayer` and `CircleLayer`. `Mapbox.setAccessToken` is called there with `process.env.EXPO_PUBLIC_MAPBOX_TOKEN`; the style is `process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL`. Camera framing uses `bounds` plus the root `padding` prop.
- Database columns (migration `supabase/migrations/20261026150545_init_schema.sql`): `terminals(id, coop_id, name, lat, lng)`, `routes(id, terminal_id, destination_name, destination_lat, destination_lng, vehicle_type, route_line jsonb GeoJSON LineString, guide_fare_regular, guide_fare_discounted)`, `vehicles(id, route_id, plate, vehicle_type, status 'off_duty'|'loading'|'departed', driver_fare)`. Logged-in users can read all of these under RLS. Never send the user's id for writes; there are no writes in your scope.
- Supabase client: `import { supabase } from "@/lib/supabase"`. Query example: `supabase.from("routes").select("id, destination_name, destination_lat, destination_lng, vehicle_type, route_line, guide_fare_regular, guide_fare_discounted, terminal:terminals(id, name, lat, lng)")`.

## Build these three screens

### 1. Home, `src/app/commuter/(home)/index.tsx`
- Full-screen map (keep the existing style and token setup). Show every terminal as an accent dot (from `listDestinations` or a `listTerminals` you add to the API if cleaner). Show the user's location dot with `UserLocation` from `@rnmapbox/maps` only after permission is granted.
- A search box over the map, top of the screen, respecting the status bar: placeholder "Where to? e.g. Pacol". Typing filters the destination names from `listDestinations` (case-insensitive contains). Results as a list under the box. Tapping a result navigates with `router.push({ pathname: "/commuter/options", params: { destination: name } })`.
- A **Drop a pin** button (secondary style) that switches the map into pin mode using `PinPicker`; when the user confirms a pin, navigate to Options with the pin's `lat` and `lng` as params. Options calls `nearest_routes` with them. No distance math in the app; the database does it.
- Location permission: ask with `expo-location` `requestForegroundPermissionsAsync()` only when the user first taps a **Near me** button or opens Options (needed to sort terminals by distance). One sentence before asking. Denied: no user dot, Options sorts by terminal name.

### 2. Options, `src/app/commuter/(home)/options.tsx`
- Reads `lat`, `lng` and an optional `label` (the destination name, when the user searched by name) from `useLocalSearchParams`. Loads `listRideOptions({ lat, lng }, me)` through `use-ride-options.ts`, which calls `nearest_routes` and then the two follow-up reads for vehicles (route lines are only needed on the Route screen).
- One card per row, in the order the function returns. Card content, every line a text label, never color alone:
  - Vehicle type icon (`@expo/vector-icons`, MaterialCommunityIcons: `bus` for jeepney, modern jeepney and bus, `rickshaw` for tricycle) and the label from `VEHICLE_TYPE_LABELS`.
  - "To {destination_name}" and "Drops you {drop_m} m from your pin" when `drop_m` is over 150 m.
  - Terminal name, and "1.2 km away" from `terminal_m` when location is known.
  - Status line: "2 now loading", "None loading right now".
  - Fare: official guide "₱14.00 (₱11.20 discounted)" and, when a loading vehicle has `driver_fare`, "Driver's fare ₱15.00" with "Above the official fare" in `text-destructive` if higher. Peso format: `₱${n.toFixed(2)}`. If no guide fare, "Fare not set yet".
- Tap a card: `router.push({ pathname: "/commuter/route", params: { routeId } })`.
- Loading, error with Try again, and empty state "No rides to {destination} yet" (Pro Max: empty states carry a message and an action).

### 3. Route, `src/app/commuter/(home)/route.tsx`
- Reads `routeId`. Loads `getRouteDetail(routeId)` through `use-route-detail.ts`.
- Map (top 55% of the screen): the route line in `colors.primary` width 4, the terminal as an accent circle, the destination as a primary circle, camera fitted to the line with padding. Live vehicle markers are after H10; leave a comment where they go.
- Card below: "Ride the {Jeepney} from {terminal} to {destination}", the fare lines as in Options, the status line.
- Buttons: **Go to terminal** opens the phone's maps app: `Linking.openURL(\`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(terminalName)})\`)`. Primary style. Below it, two disabled buttons with a "Coming soon" caption: **Scan to board** and **Pay**. Disabled must look disabled (`opacity-50`, `disabled` prop, `accessibilityState={{ disabled: true }}`).

## Quality bar
- Touch targets at least 48 dp; all `Pressable`s have `accessibilityRole="button"`; pressed feedback (`active:opacity-80` or `android_ripple`).
- Safe areas: the search box and the card respect the status bar and the tab bar (`useSafeAreaInsets` from `react-native-safe-area-context`).
- Keep it small: no state library, no context, no extra abstraction. `useState` and the hooks pattern are enough.
- Any shortcut with a known limit gets a one-line comment: `shortcut: <limit>, <when to upgrade>`.
- Do not change files outside your list even if you see a problem; write it in your Report instead.

## Report
(append here when done)
