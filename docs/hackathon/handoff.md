# Handoff notes (team) [AI: FOLLOW]

Notes between the three of us while we build in parallel. **Newest section on top.** Each person adds a short section before a sleep shift or when they hand something over: done, in progress, blocked, next, and anything a teammate must decide. If you are an AI assistant reading this after a pull: read the newest sections, act on the items addressed to your person, and point out anything here that conflicts with `prep-plan.md` (its Decisions Log wins) or `tech-stack.md`.

---

## Oct 28, JM → Matt and Rj: Scan to board is in, needs a two-phone test

- **Matt, I used your slot** in `src/app/commuter/(home)/route.tsx`: an import and `<ScanToBoard />` under "Go to terminal", same as the live markers. Your comment there now marks the slot for **Pay** only. The component lives outside your folders (`src/components/scan-to-board.tsx`, call in `src/lib/api/boarding.ts`), so your UI/UX edits to `route.tsx` will not collide. Move or restyle it as you like.
- **What it does:** an orange **Scan to board** button opens the camera (asks for location and camera the first time), reads the QR on the driver's QR tab, and shows **"Boarded SMP-1001"** or the server's message in red with Try again. It takes its own fresh, high-accuracy GPS fix, because `getMyLocation` accepts one up to 5 minutes old and the check is 100 m.
- **Driver QR tab** now uses Rj's `LoadingState`, `ErrorState` and `EmptyState`.
- **Not phone-tested yet** (needs two phones). Whoever is awake with JM:
  1. JM's account on SMP-1001 as driver (SQL in the scratchpad routine), **Start trip**, open the **QR** tab: "Passengers today: 0".
  2. Second phone, any commuter account: search Pacol, open a ride option, **Scan to board**, scan JM's QR from about 1 m. Expect "Boarded SMP-1001" and the driver's count at 1 within about 5 s.
  3. Scan again: "You already boarded this vehicle". Scan any other QR: "This is not a Larga boarding code".
  4. Clean up: delete today's `boardings` for SMP-1001.
- **Known limit:** the GPS fix has no timeout, so indoors "Checking you are at the vehicle" can spin. Test outside or at a window.
- **Two live GPS review fixes, also not phone-tested** (one phone is enough): End trip while offline now stops sharing, shows "Location sharing stopped, but Off duty was not saved" and goes back to Start trip; and the GPS task stops itself within about 5 s if the coop unassigns the vehicle mid-trip (before, it failed every 5 s until End trip). Test: Start trip, airplane mode, End trip; then Start trip and set `driver_id = null` on SMP-1001 in the SQL Editor, and the pinned notification should disappear.

---

## Oct 28 (4 am), Rj → Matt: UI/UX pass on the shared pieces, and your screens' findings

- **What is happening:** a UI/UX audit (ui-ux-pro-max checklist) found 10 issues. Rj's worker chat is adding shared components in `src/components/ui/` (`Button`, `Card`, `Badge`, `EmptyState`, `LoadingState`/`ErrorState`) and restyling the driver, auth and coop screens. Palette A is unchanged and **nobody touches your files** (`commuter/*`, `components/commuter/*`) while you nap.
- **When the pieces land (pull first),** `Button` and `Card` give you pressed and disabled states, 48 px touch targets and `shadow-sm` for free. These are your findings, in demo order:
  1. **Fare is buried** (`options.tsx:76-81`, `ride-lines.tsx:21-31`): the driver's fare is the answer but looks like every other line. Make it `text-2xl font-bold` with the guide fare in `text-muted`; add a chevron-right to the card. The bus icon on `options.tsx:62` shows for jeepneys too; use a jeepney-ish icon.
  2. **Map markers use color only** (`route.tsx:116-135`): orange terminal, blue destination, no labels. Add a Mapbox `SymbolLayer` text ("Terminal" / "Destination") or a legend row under the map. This breaks the "never color alone" rule.
  3. **Orange badge text** (`ride-lines.tsx:12`): white on orange is 3.0:1, so use `text-lg font-bold` (large text passes). `Badge` does this.
  4. **Hex values:** map strokes `"#FFFFFF"` in `commuter/(home)/index.tsx:126` and `route.tsx:122,130`, and the tab bar in `commuter/_layout.tsx:13`. `colors.white` is being added to `src/lib/colors.ts`.
  5. **Floating search input** (`commuter/(home)/index.tsx:135-143`): no shadow and a faint border. Add `shadow-sm`.
  6. **Padding:** `options.tsx` uses `p-4`, most screens use `p-6`. Pick one.
  7. **Bare spinners and plain empty text** in `options.tsx:20,26-43` and `route.tsx:70`: use `LoadingState` and `EmptyState`.
- Nothing here changes data or logic. Unsure about any of it, ask Rj.

---

## Oct 27 (late night, later), JM → Matt and Rj: boarding is live (migration 7), driver QR tab

- **Migration 7 is pushed:** every vehicle has a board token (existing ones filled in, new ones from a trigger). Pre-push test and live checks: RLS behaviour 66/66, search 12/12, 28/28 OK. Security review clean.
- **Driver QR tab** (Trip · QR · Account): the board QR full screen, the plate, and "Passengers today", refreshed every 5 s. Tested on JM's phone, including a pretend boarding from the SQL Editor.
- **Matt, for Scan to board** (the slot in `route.tsx`):
  ```ts
  const { data: vehicleId, error } = await supabase.rpc("board_vehicle", {
    p_token: scannedText, p_lat: me.lat, p_lng: me.lng,
  });
  ```
  `error.message` is ready to show as is: "This is not a Larga boarding code", "This vehicle is not sharing its location right now" (`LG001`), "You are too far from this vehicle to board it" (`LG002`, over 100 m), "You already boarded this vehicle" (`LG003`, within 10 min). Only commuter accounts can board. Who wires it is still open (JM can, as with the live markers).
- **Matt, your Trips tab** can go live now: the query in the comment in `src/app/commuter/trips.tsx` works against the live database (a commuter reads only their own boardings).
- **Rj:** nothing to do in the coop screens; a vehicle you add gets its token automatically.

---

## Oct 27 (late night), JM → everyone: where things stand, what is next

**State:** the snapshot is the "Current hour / phase" row in `prep-plan.md`. Live database: migrations 1 to 6 plus the Naga seed; checks 53/53, 12/12, 25/25 OK. Every pushed migration was first run in a rolled-back pre-push test (migration + its check file in one `begin ... rollback`).

**JM next, in order:**
1. **Boarding** (planned, not started): migration 7 `board_vehicle(token, lat, lng)` (commuters only; vehicle position fresh under 30 s and within 100 m; no second boarding of the same vehicle within 10 min; inserts the trip; a board token for every existing and new vehicle; `vehicle_tokens` readable only by that vehicle's driver). Then a driver **QR** tab (board QR full screen, passengers today). Open question for Matt: who wires **Scan to board** into the slot in `route.tsx` (JM can, as with the live markers).
2. Promote Rj's coop and driver test accounts (waiting on the emails), coop redirect test.
3. Firebase (`google-services.json`) and one rebuild for push; then a **standalone demo APK** (a dev build only runs while a laptop serves the code).
4. Before the H16 freeze: long GPS battery test, the two small fixes from the live GPS review (End trip offline label; the GPS task stops itself when the vehicle is unassigned), `/ponytail-audit`, the UI/UX pass (designer's look + Pro Max checklist).

**Matt:** phone-test your commuter flow (search Pacol, ride options, route, live jeep markers). **Mentor's idea, saved trips**, is in the Decisions Log as proposed: recent and pinned destinations on the phone first, no database change.

**Rj:** install the dev build (JM invited you to the Expo org), send JM your test account emails, phone-test the coop screens.

---

## Oct 27 (night), JM → Matt and Rj: live GPS from the driver phone works (migration 5)

- **Workers' code is merged and reviewed** (Matt's push `0a4beec`): tsc and lint clean, `/for-drivers` fix and no "Coming soon" confirmed. After pulling, run `npm install` and start Metro once (`npm start`): Metro regenerates the typed routes, otherwise `npx tsc` reports `/waiting`, `/for-drivers` and `/commuter/options` as unknown.
- **Migration 5 is live:** `update_my_location(lat, lng)` saves the driver's own vehicle position (one row per vehicle in `vehicle_positions`). Checks: RLS behaviour 44/44, search 12/12, 24/24 OK.
- **Driver screen:** Worker B's `FirstTripChecklist` is wired in; **Start trip** shares the phone's location about every 5 s with a pinned notification, also with the screen locked or the app swiped away (tested on JM's phone); **End trip** stops it and sets Off duty; **Sign out** ends a running trip first.
- **Driver tabs:** Trip (the driver screen) and Account (name, email, coop, Sign out), same pattern as the commuter tabs; QR joins with boarding. `signOut` is exported from `src/components/sign-out-button.tsx` and ends a running trip first. Matt: `commuter/account.tsx` could call it too (harmless as is, commuters never run trips).
- **Matt, live jeeps on your Route map:** I put 2 lines in the slot you left in `src/app/commuter/(home)/route.tsx` (an import and `<LiveVehicles routeIds={[routeId]} />`), so it could be tested tonight. The hook is `src/hooks/use-vehicle-positions.ts` (Realtime, hides a jeep silent for 15 s); the marker is `src/components/live-vehicles.tsx`, a cyan dot with "SMP-1001 · Now loading", a placeholder until the designer sends a vehicle icon (colors and size at the top of that file). Tested on JM's phone with the SQL Editor playing the driver. Move or restyle it as you like.
- **Test account:** `markphilips@example.com` is a commuter again and `SMP-1001` has no driver.
- **Rj, migration 6 is pushed** (payment QR): pre-push and live checks 53/53, 25/25 OK; your coop Vehicles screen can read `payment_qr_by_driver` now. Merge note: your "Oct 27, scope" row and JM's "Oct 27, live map" row both stay in the Decisions Log. **For your coop QR entry later:** when a coop saves a vehicle's `payment_qr`, also set `payment_qr_by_driver = false`, or the list keeps saying "set by driver".

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
