# Handoff notes (team) [AI: FOLLOW]

Notes between the three of us while we build in parallel. **Newest section on top.** Each person adds a short section before a sleep shift or when they hand something over: done, in progress, blocked, next, and anything a teammate must decide. If you are an AI assistant reading this after a pull: read the newest sections, act on the items addressed to your person, and point out anything here that conflicts with `prep-plan.md` (its Decisions Log wins) or `tech-stack.md`.

---

## Oct 27 (night), JM → Matt and Rj: live GPS from the driver phone works (migration 5)

- **Workers' code is merged and reviewed** (Matt's push `0a4beec`): tsc and lint clean, `/for-drivers` fix and no "Coming soon" confirmed. After pulling, run `npm install` and start Metro once (`npm start`): Metro regenerates the typed routes, otherwise `npx tsc` reports `/waiting`, `/for-drivers` and `/commuter/options` as unknown.
- **Migration 5 is live:** `update_my_location(lat, lng)` saves the driver's own vehicle position (one row per vehicle in `vehicle_positions`). Checks: RLS behaviour 44/44, search 12/12, 24/24 OK.
- **Driver screen:** Worker B's `FirstTripChecklist` is wired in; **Start trip** shares the phone's location about every 5 s with a pinned notification, also with the screen locked or the app swiped away (tested on JM's phone); **End trip** stops it and sets Off duty; **Sign out** ends a running trip first.
- **Matt:** live positions are in `vehicle_positions` (`vehicle_id`, `lat`, `lng`, `updated_at`), already in the Realtime publication. JM's next units: driver tabs, then a `useVehiclePositions(routeIds)` hook (Realtime, hides a vehicle after 15 s) for your Route screen's marker comment.
- **Test account:** `markphilips@example.com` is a driver of the sample jeepney coop on `SMP-1001` (for testing; JM undoes it later).

---

## Oct 27 (night), Matt → JM and Rj: nap plan, worker chats running, geocoding verdict

- **Plan and file ownership:** `docs/hackathon/plan-matt-nap.md`. Decisions D1 to D5 (no anonymous sessions; driver wait via a local flag; full name stored, "Marc B." shown to others; three tabs per role; Go to terminal opens the phone's maps app). Two Opus worker chats are building from `docs/hackathon/briefs/`: Worker A the commuter Home, Options and Route screens against `nearest_routes` and the seed; Worker B the Welcome and driver screens, the Waiting screen, the Trips and Account tabs, and a `FirstTripChecklist` component. **Please do not edit the files in the ownership table until the nap ends.** Matt's chat reviews their diffs, runs tsc and lint, and leaves the changes uncommitted for JM.
- **Skeleton is pushed:** commuter tabs (`src/app/commuter/_layout.tsx`, Home is the `(home)` stack), `src/lib/api/commuter.ts` types, `src/lib/names.ts` (`shortName`), `src/lib/colors.ts` (Palette A hex for Mapbox layers and tab tint), placeholder screens, and the root layout entries `commuter`, `waiting`, `(auth)/welcome`, `(auth)/for-drivers`. One JS package added: `@expo/vector-icons`, no rebuild.
- **Mapbox style URL is set** in Matt's `.env` and the map renders it on the phone. JM: ask Matt for the URL if your `.env` still has the placeholder.
- **Geocoding check (Mapbox Geocoding v6, proximity Naga):** barangays and streets resolve ("Pacol" → the barangay, "Panganiban Drive"), landmarks do not ("SM City Naga" returns only a road, "Ateneo de Naga" nothing, "People's Mall" lands in Bacolod). **Decision:** no place search in the Must-have; the commuter searches our own destination names or drops a pin. Barangay-name geocoding is a possible Satisfier. The Search Box API (points of interest) was not checked.
- **`nearest_routes` is exactly what the commuter screens needed**, thanks. Worker A calls it with the destination's point for a name search and with the pin otherwise, then reads vehicles and `route_line` separately as you described.

### JM
- When Worker B reports done, its Report in `briefs/worker-onboarding.md` has the two lines to add `FirstTripChecklist` to `driver/index.tsx`.
- Suggested driver tabs (`driver/_layout.tsx`: Trip, QR, Account) are in the plan; the commuter tabs layout is the pattern to copy.
- `npx tsc` TS2882 on `global.css`: it clears once `npx expo start` has generated `expo-env.d.ts` (it references `expo/types`, which declares `*.css`). Rj's error is a fresh checkout that has not started Metro yet; no code change needed.

### Rj
- Terminal and destination names in `data/routes/*.json` are the ones Matt uses on the map: Pacol Terminal (Centro) / (Pacol) / (Ateneo Turn); San Felipe Terminal (Centro) / (Pacol Boundary) / (Megaprime) / (7-Eleven); Carolina Terminal (Centro) / (Carolina); Panicuason Terminal (Centro) / (Panicuason). If your seed used different spellings, either is fine, but tell Matt which so the demo script matches.
- "Centro" is a different point per route file, because each line loads at a different Centro spot. That is intended.

---

## Oct 27 (later), JM → Matt and Rj: Naga seed loaded, search fix (migration 4)

- **Rj's seed is in the live database:** 2 sample coops (jeepney coop `b6ee27cb-34ef-53a9-90f2-18804abddbe5`, tricycle TODA `c9a516b2-c5aa-5668-ab80-6e68d988b3d9`), 12 terminals, 19 routes (traditional and modern rows), 6 vehicles (off duty, no driver).
- **Search fix:** `nearest_routes` now skips a route whose terminal is within 300 m of the pin. Before, a pin at Pacol listed Pacol to Centro first. Same call, same columns.
- **Matt:** route lines are now in `routes.route_line`, so your map can read them from Supabase instead of `data/routes/*.json`. Try a pin at Pacol (13.6589, 123.2512): Centro to Pacol comes first, then Carolina and Panicuason jeeps that pass through Pacol.
- **Known limit (say it in the pitch):** a jeep that passes your pin shows its full-route fare. A Carolina jeep through Pacol shows ₱32.80, not about ₱24.
- **Rj:** send JM the coop and driver test account emails; the coop goes in the sample jeepney coop and the driver gets `SMP-1001`.

---

## Oct 27 (later), JM → Matt and Rj: migration 3 is live

- **Rj:** your migration is pushed (renamed in its comment to migration 3, since search took 2). Added one test, "coop adds a modern jeepney route": `rls_behaviour.sql` is now **36 of 36**, all passing on the live database. Send JM the emails for your coop and driver test accounts to promote.
- **Rj, tsc error:** `npx tsc --noEmit` passes on JM's laptop with all merged code; the `global.css` error does not show. Run `npm install` (it follows the lockfile) and send `npx tsc -v` if it persists.
- **Matt:** `vehicle_type` can now be `modern_jeepney`, also in `nearest_routes` results. Use `VEHICLE_TYPE_LABELS` from `src/components/coop/vehicle-type-chips.tsx` for the names ("Traditional jeepney", "Modern jeepney", ...). The driver screen uses it too.
- **Dev build for Matt and Rj:** the current build still works for everyone (only JS packages were added since). Steps are in "Get set up" in the first Oct 27 section below; JM invites you to the `motomeetables` Expo org.

---

## Oct 27 (later), JM → Matt and Rj: destination search is live (migration 2)

**Matt:** the search you asked for is in the live database.
```ts
const { data, error } = await supabase.rpc("nearest_routes", {
  p_dest_lat: pin.lat, p_dest_lng: pin.lng,
  p_my_lat: me?.lat, p_my_lng: me?.lng, // optional: send both or neither
});
```
- Returns up to 10 rows, one per route, closest first: `route_id`, `destination_name`, `vehicle_type`, `terminal_id`, `terminal_name`, `terminal_lat`, `terminal_lng`, `guide_fare_regular`, `guide_fare_discounted`, `drop_m` (pin to the nearest point of the route line, or to the destination when a route has no line) and `terminal_m` (you to the terminal; null without your location).
- No distance cutoff: when every `drop_m` is large, show "drops you X km away" and pick your own threshold.
- Route lines and vehicles are separate reads, as agreed: `supabase.from("routes").select("id, route_line").in("id", ids)` and `supabase.from("vehicles").select("route_id, status, driver_fare, plate").in("route_id", ids)`.
- Drops within 100 m count as a tie; then the terminal nearest the commuter comes first.

**Rj:** `routes.route_line` must be a bare GeoJSON **LineString** with at least 2 points, `{"type": "LineString", "coordinates": [[lng, lat], ...]}`. Matt's files in `data/routes/` are whole FeatureCollections, so seed only the geometry of the feature whose `kind` is `route`. The database refuses anything else.

---

## Oct 27 (later), Rj → JM and Matt: coop screens written, not yet tested on a phone

- **Pull, then `npm install`.** No new packages and no rebuild.
- The coop home is now a **terminal list**:
  - **Terminals:** add or edit a terminal's name and location. Tap the map to drop the pin.
  - **Routes:** tap a terminal to see its routes, then add or edit one: destination pin, vehicle type, official regular fare, and an optional discounted fare (not above the regular fare). `route_line` is never sent, so seeded lines stay.
  - **Vehicles:** add or edit a vehicle's plate, type, route and driver (your coop's only). The Off duty / Now loading / Departed buttons on each row are the dispatcher override (a plain update under RLS, not the driver's RPC).
- **Pattern** (same as the driver screen): `src/lib/api/coop.ts` → `src/hooks/use-my-terminals.ts`, `use-terminal-routes.ts`, `use-my-vehicles.ts` → `src/app/coop/`. Shared pieces: `src/components/coop/pin-picker.tsx` (reusable map pin picker) and `vehicle-type-chips.tsx`.
- **Not tested on a phone or against the live database yet.** `npx tsc --noEmit` shows only the error below; lint is clean.

### JM
- **Promote my test accounts:** one coop and one driver with the same `coop_id` (I'll send the emails). I need them to test.
- **`_layout.tsx`:** I added five lines inside the logged-in `Stack.Protected`: `coop/terminal`, `coop/routes`, `coop/route`, `coop/vehicles`, `coop/vehicle`. Nothing else in the file changed.
- **tsc error on a fresh install:** `src/app/_layout.tsx(1,8)` TS2882 "Cannot find module '../global.css'" (TypeScript 6 checks side-effect imports). Probable fix: `declare module "*.css";` in `nativewind-env.d.ts`.
- **RLS gap on `vehicles`:** insert and update check that `route_id` is ours but **not `driver_id`**, so a crafted request could assign another coop's driver. Suggest adding this to both `with check` clauses in migration 2: `and (driver_id is null or exists (select 1 from public.profiles p where p.id = driver_id and p.role = 'driver' and p.coop_id = (select public.my_coop_id())))`.
- **Fare question:** my answer on A or B and on bus operator sign-up is coming separately.

### Matt
- Routes and fares a coop edits are the same `routes` rows your commuter screen reads, so a change shows on your next load.
- If you need a map pin picker for "drop a pin" on the commuter side, `PinPicker` takes `{ pin, onPick }`.

### Next (Rj)
- Phone test of all three screens with the promoted accounts.
- Seed SQL (coops, terminals, routes, vehicles), once the fare question is settled and I have real Naga terminal data.

---

## Oct 27 (later), JM → Matt and Rj: driver screen works

- The driver home shows the driver's vehicle, route and official fare guide, with **Now loading / Departed / Off duty** buttons and a fare field ("Above the official fare" when higher). Tested on JM's phone with throwaway TEST rows, since deleted.
- **Pattern to copy** for your screens: `src/lib/api/driver.ts` (queries and RPC calls) → `src/hooks/use-my-vehicle.ts` (loads and reloads) → `src/app/driver/index.tsx`.
- **Matt:** a vehicle's `status` (`off_duty`, `loading`, `departed`) and `driver_fare` are readable by any signed-in user from `vehicles`. Your screen sees a change on its next load; live updates come with Realtime after H10.
- **Rj:** a driver needs a vehicle with `driver_id` set to their account, or their screen says "No vehicle assigned yet". Include that in the seed or the coop's vehicle screen.

---

## Oct 27 (later), JM → Matt and Rj: login works

- **Pull, then `npm install`.** New packages are JS only (Supabase client, react-hook-form, Zod), **no rebuild**.
- The app now opens on **Sign in**. Create an account in the app; it is a commuter. For a driver or coop account, tell JM the email.
- After sign-in you land on your role's home. The role picker is gone. Each placeholder home has a **Sign out** button; keep it somewhere on your real screen.
- In your code: `import { supabase } from "@/lib/supabase"`. Your screens can assume a signed-in user. Your own id is `(await supabase.auth.getSession()).data.session.user.id`, for filtering reads only; never send it for writes.
- Form rules go in `src/lib/validation.ts` (Zod). `src/components/form-field.tsx` is a labelled input with its error message, reusable in any react-hook-form form.
- Use **Node 22**: on Node 20, pressing `w` (web) crashes. The phone works on both.

---

## Oct 27, JM (integrator) → Matt and Rj

### Done and pushed
- **Expo app** (SDK 56, `src/` layout): a temporary role picker at `src/app/index.tsx`, and one placeholder home per role in `src/app/commuter/`, `src/app/driver/`, `src/app/coop/`. Replace your own placeholder; leave the others alone.
- **NativeWind + Palette A**: use the class names from `tailwind.config.js` (`bg-background`, `text-foreground`, `text-muted`, `bg-primary`, `bg-accent`, `border-border`, ...), never hex values. Orange `accent` only on buttons and badges with white text.
- **Every native module is already installed** (Mapbox, location + background task, camera, QR, notifications, AsyncStorage). Do not add a native module without telling JM: it forces all three of us to rebuild.
- **Supabase migration 1 is live**: all tables, RLS, and the driver functions `set_vehicle_status` and `set_my_fare`. Checked on the live database: `supabase/checks/rls.sql` 22/22 OK, `supabase/checks/rls_behaviour.sql` 31/31 PASS.
- **Lint hook**: committing a file with an ESLint error is blocked. Prettier formats code files on commit (not docs).

### Get set up (about 15 min)
1. Pull, then `npm install` (this also turns on the lint hook).
2. Copy `.env.example` to `.env` and fill the four values. Ask JM privately for the Supabase URL and publishable key; Matt has the Mapbox token. Never commit `.env`.
3. Install the **dev build** on your Android phone: https://expo.dev/accounts/motomeetables/projects/larga/builds/fcf1ba9e-adf2-48e1-8bd8-6818aef050f8 (ask JM to invite you to the `motomeetables` Expo org if the page asks you to log in, or for the direct APK link).
4. `npm start`, open Larga on the phone, pick your laptop. Same Wi-Fi; if it cannot connect, `npx expo start --tunnel`. Use the dev build, not Expo Go: Expo Go cannot run the map, background GPS or push.
5. Add packages with `npx expo install <pkg>`. Before pushing: `npx tsc --noEmit` and `npm run lint`.

### Database facts you need
- **Locations are plain `lat` / `lng` numbers**, not PostGIS columns (Supabase returns PostGIS columns as unreadable hex). Columns per table are in the data table in `tech-stack.md`.
- **Everyone signs up as a commuter.** Coop, bus operator and driver accounts are promoted by JM in the SQL Editor (snippet in `tech-stack.md`, Accounts). A driver also needs `coop_id` so their coop can see and assign them. Tell JM the email to promote.
- Logged-out users can read nothing; your screens need a signed-in user (login is JM's next unit).
- Schema changes go through JM: write the SQL as a new migration file (`npx supabase migration new <name>`), JM reviews, tests and runs `db push`.

### Rj: decide before seeding fares (A or B)
The research row sets jeepney fares from the LTFRB: **traditional ₱14 for the first 4 km + ₱2/km, modern ₱17 + ₱2.40/km**, 20% discount. The `routes` table stores **one official fare per route and vehicle type**, and the types are only `jeepney`, `tricycle`, `bus`, so a route with both kinds of jeep can show only one fare.
- **A (JM's suggestion):** JM adds a `modern_jeepney` type in a small migration 2; each route then gets one row per jeep type with its own fare.
- **B:** seed traditional fares only and mention modern jeeps in the pitch.

Tell JM "A" or "B". Also still open from earlier: does "bus operators register like coops" mean we create their accounts (current safe default), or something else? Self-chosen roles would let anyone edit fare guides.

### Rj: seeding
Seed coops, terminals, routes (fare guide) and vehicles as a SQL file JM can run, or give JM a sheet. Each terminal and destination needs `lat` and `lng`. Fares per destination come from the LTFRB per-km rates and each route's distance (tricycles: Naga Ord. 2024-002, ₱15).

### Matt
- `.env` still has the placeholder `EXPO_PUBLIC_MAPBOX_STYLE_URL`; send JM your style URL when it is ready (the map can use a default Mapbox style until then).
- Route lines are stored as GeoJSON in `routes.route_line`; GeoJSON coordinates are **[lng, lat]**. Checked: `data/routes/pacol-centro.json` and `san-felipe-centro.json` already use that order (GeoJSON saved as `.json` so Metro can import it).
- Matching a pinned or searched destination to the nearest served destination needs a small database function; tell JM the inputs and outputs you want and JM adds it in a migration.

### Next (JM)
Login and roles: sign-in and sign-up screens, and the role picker replaced by a redirect to each role's home by `profiles.role`. Your screens can then rely on a signed-in user.

### Later
- **Firebase** (`google-services.json`) for push: after H10, one rebuild.
- After-H10 database functions: `update_my_location`, `board_vehicle`, `push_tokens`.
