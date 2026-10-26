# Tech Stack (decided) [AI: FOLLOW]

Stack for Larga, the terminal commute app, decided 2026-10-26. Built on the terminal pivot in `terminal-pivot.md`. The Decisions Log in `prep-plan.md` records each choice and wins if anything here goes stale. Researched with Context7 (Expo, rnmapbox, Supabase, RevenueCat, Laravel, Railway, Render docs).

This replaces the earlier Laravel + Inertia web proposal. We reuse setup knowledge from the team's other Expo + Supabase app, not its code.

## The short version

| Layer | Pick | Why |
| --- | --- | --- |
| App | **Expo SDK 56** (React Native 0.85, React 19), TypeScript, **Android APK** | The versions we already know work together with NativeWind 4, Reanimated 4, rnmapbox and task-manager |
| Routing | **Expo Router** (file-based, `src/app/`) | One folder per role |
| Styling | **NativeWind 4** (Tailwind 3), theme tokens in `tailwind.config.js` | Tailwind classes we already use; the designer's colors live in one file |
| State and forms | **Zustand** (`stores/`), **react-hook-form + Zod** (`lib/validation.ts`) | Team comfort; few stores, few forms |
| Backend | **Supabase only, no custom server**: Auth, Postgres + **PostGIS**, **RLS**, RPCs, **Realtime**, Edge Functions (Deno) | One service, one language (TypeScript), nothing of our own to host |
| Map | **Mapbox** via `@rnmapbox/maps` | Custom style from the designer (Mapbox Studio). Route lines are **stored once**, no live routing API |
| Live updates | **Supabase Realtime** on vehicle positions and status | No polling code |
| Driver GPS | **expo-location + expo-task-manager** (background task, Android foreground service) | Keeps sharing while the screen is off; the reason we build an APK |
| QR | **expo-camera** (scan) + **react-native-qrcode-svg** (show) | Boarding QR and payment QR |
| Push (after H10) | **expo-notifications + Expo Push**, sent by a `send-push` Edge Function | "Your jeep is now loading" |
| Build | **EAS Build** (cloud APK); backup: `npx expo run:android --variant release` on one laptop | EAS local builds do not support Windows; `expo run:android` does |
| Tooling | ESLint 9 (`eslint-config-expo`) + Prettier, Husky + lint-staged blocks commits with ESLint errors | Same as our other app |

**Not used:** Laravel, Inertia, Filament, Railway or Render (nothing to host), Turf.js, Mapbox Map Matching and Directions, PayMongo, **RevenueCat** (subscriptions go in the pitch only, see below), Supabase Storage, pg_cron. Do not install a package until a screen uses it.

## What every laptop needs

- **Node 22 LTS** (Expo SDK 56 needs 20.19 or newer)
- Git, VS Code, an Android phone with our **dev build** installed
- **EAS CLI** (`npm i -g eas-cli`) and the **Supabase CLI** (run as `npx supabase`; confirmed working on Windows, version 2.122)
- **One laptop only:** Android Studio (the Android SDK version Expo's setup guide asks for) + **JDK 17**, as the local build backup
- No PHP, Composer or local database

**Accounts (one person each):** Expo (EAS), Supabase (one project, **Singapore** region), Mapbox (public token), Firebase (FCM credentials for push, after H10).

## How each feature works

### Accounts and roles
- Supabase Auth, **email + password**. **Email confirmation off** for the demo (the built-in email sender is heavily rate-limited; exact limit not checked).
- `profiles.role`: `commuter`, `driver`, `coop`. Everyone signs up as a commuter. **Users can never change their own role**: driver and coop accounts are seeded or promoted by us (or a later coop RPC), never from the client. Bus operators are coops of type `bus_operator`, created the same way.
- To promote an account, the integrator runs in the SQL Editor (a driver also needs `coop_id`, so their coop can see and assign them):
  ```sql
  update public.profiles set role = 'coop', coop_id = '<coop id>'
  where id = (select id from auth.users where email = 'someone@example.com');
  ```
- Session stored with AsyncStorage. The app holds only the anon (publishable) key.
- Routes: `src/app/commuter/`, `src/app/driver/`, `src/app/coop/`, plus the sign-in screens. Plain folders, not `(groups)`: groups add no URL segment, so three `(group)/index.tsx` files would all claim `/`. Sign-in and sign-up live in `src/app/(auth)/`. `Stack.Protected` in `src/app/_layout.tsx` sends logged-out users there, and `src/app/index.tsx` redirects a signed-in user to their role's home by `profiles.role`.

### Core flow: destination-first guide (Must-have)
1. Commuter picks where they want to go, two ways like Google Maps: **search** a place and pick from the result list, or **drop a pin** on the map.
2. The app matches it to the nearest destination we serve (a PostGIS distance function, still to be written) and shows **what to ride and which terminal to go to**; when several terminals serve it, the nearest to the commuter comes first.
3. For each option: vehicle type, the vehicles' own fares, the **official fare guide** (regular and discounted), the route line on the map, and which vehicles are **now loading** or **departed**.
4. **Fares:** each driver sets their own fare on their vehicle. The official guide (LTFRB rates for jeepneys, the city ordinance for tricycles, see 7) is stored in the `routes` table, one row per terminal and destination, **per destination only**. A driver's fare above the guide is labelled "Above the official fare". No in-app report; commuters dispute it themselves using the guide.
5. **Buses get the full features**, same as jeepneys and tricycles; a bus operator registers as a coop-type account.
6. Place search: Mapbox Search/Geocoding API (not checked yet: free tier and how well it knows Naga places; fallback is searching our own destination names).
7. Fare guide values: Naga tricycles per City Ord. 2024-002 (₱15, 20% discount); jeepneys per the **LTFRB national rates** from Sept 28, 2026 (traditional ₱14 for the first 4 km + ₱2/km, modern ₱17 + ₱2.40/km, 20% discount). Sources in `research.md`.

### Coop screens (Must-have)
- Coop users edit their terminals, routes and fares, and vehicles, inside the app.
- Place a terminal with the map pin picker. Route lines are drawn or entered once and stored as GeoJSON.
- RLS lets a coop user write only rows of their own coop.

### Live tracking and status (after the core flow)
1. Driver taps **Start trip**. The app asks for location ("Allow all the time") and starts a background location task with a foreground service notification, about every **5 s**.
2. Each fix calls the `update_my_location` RPC, which upserts that driver's row in `vehicle_positions`.
3. Driver sets **now loading** or **departed** (`set_vehicle_status` RPC). A dispatcher or coop user can also change it from the coop screens.
4. Commuter screens subscribe to Realtime on `vehicle_positions` and `vehicles`, and hide a vehicle whose position is older than **15 s**.
5. **End trip** stops the task and sets the vehicle off duty.

Limit to say in the pitch: tracking runs while the driver's app keeps its foreground service on; a real rollout may need a GPS unit per vehicle.

### Boarding QR (after the core flow)
- Each vehicle has a random reusable `board_token` (in `vehicle_tokens`), shown as a QR on the driver's screen.
- Commuter scans it with the in-app scanner. The app calls `board_vehicle(token, lat, lng)` with the commuter's current location.
- The RPC accepts only if the vehicle's position is fresh and within about **100 m** (`ST_DWithin`); otherwise it rejects. This stops a photo of the QR being scanned from anywhere.
- A boarding gives the commuter a **trip record** and the driver a **passenger count**.
- The commuter's location is used for that check only and never stored.

### Payment (third party, we never hold money)
- Each vehicle has one `payment_qr` text field, filled with the **coop's QR Ph code by default** (the coop may use the driver's own instead).
- The coop scans its printed QR once with the in-app scanner; we store the QR text and redraw it with react-native-qrcode-svg. No image uploads.
- After boarding or a fare lookup the app shows "Pay ₱__" next to that QR. The commuter pays in their own wallet app.
- **No payment confirmation** in the MVP: the driver checks their wallet notification. Cash is always fine.

### Push notifications (Satisfier, after H10)
- A status change triggers `send-push` through pg_net, with the shared secret kept in Vault.
- Needs the dev build (push does not work in Expo Go on Android since SDK 53) and FCM credentials from Firebase.

### Monetization (pitch only, not built)
- Coops or the LGU pay a small monthly fee per terminal for the dashboard and live tracking; commuters ride free.
- A consumer subscription (RevenueCat) was rejected: about ₱570 a month against a ₱14 fare, and real purchases need the app on Google Play.

## Data (first draft)

| Table | Holds | RLS in short |
| --- | --- | --- |
| `profiles` | user id (= `auth.uid()`), role, name, coop | read own; a coop reads its own drivers; update own name only, never role or coop |
| `coops` | name, type (jeepney coop, TODA, bus) | public read |
| `terminals` | coop, name, `lat`, `lng` | public read; coop writes own |
| `routes` | terminal, destination name, `destination_lat`, `destination_lng`, vehicle type, route line (GeoJSON), official regular fare, official discounted fare | public read; coop writes own |
| `vehicles` | coop, plate, vehicle type, route, driver, status, driver's fare, `payment_qr` | public read; coop writes own; status and fare changes by the driver via RPC |
| `vehicle_tokens` | vehicle, `board_token` | its own table because RLS hides rows, not columns; only that vehicle's driver reads it; `board_vehicle` reads it |
| `vehicle_positions` | vehicle (one row each), `lat`, `lng`, updated_at | public read; writes only through `update_my_location` |
| `boardings` | commuter, vehicle (kept as empty if the vehicle is deleted, so trip history survives), boarded_at | commuter reads own; driver reads count for own vehicle; insert only through `board_vehicle` |

Locations are plain `lat`/`lng` numbers (with range checks), not PostGIS columns: the API and Realtime return PostGIS columns as hex the app cannot plot. PostGIS is used only inside functions that measure distance. "Logged-in users" means any signed-in account; logged-out users can read nothing. Migration 1 (`supabase/migrations/20261026150545_init_schema.sql`) creates all tables above plus `set_vehicle_status` and `set_my_fare`; `push_tokens`, `update_my_location`, `board_vehicle` and the nearest-destination function come in later migrations. When `board_vehicle` lands, add `role = 'driver'` to the `vehicle_tokens` read rule (security review note).
| `push_tokens` (after H10) | user, Expo push token | user reads and writes own |

## Security model (non-negotiable)

- The app only holds the **anon key**. The service role key never goes in the app or the repo.
- **RLS on every table**, with REVOKEs for anything anon or authenticated users should not have (new tables are exposed automatically).
- Reads and writes use `auth.uid()`. Never send the user's id from the client.
- Anything that spans tables or needs extra checks goes through a **SECURITY DEFINER RPC** with `set search_path = ''`, which checks `auth.uid()` and validates input itself (latitude -90 to 90, longitude -180 to 180, status in the allowed list).
- Edge Functions called by the database run with Verify JWT off and check a secret header that matches a Vault secret.
- Mapbox: public token only, restricted in the Mapbox account.
- Fares shown for payment come from the database, never from the client.
- `.env` never committed.

## How we work in the code

**Folders**
```
src/app/          routes (Expo Router): commuter/, driver/, coop/
src/components/   UI grouped by feature (commuter/, driver/, coop/)
src/hooks/        per-screen data hooks
src/stores/       Zustand global state
src/lib/          supabase client, lib/api/<feature>.ts data layers, validation.ts
src/types/        shared TS types
supabase/         migrations/, functions/, checks/
```
App code lives under `src/` (the SDK 56 template's layout); import it as `@/...`. Data flows screen → hook → `lib/api/<feature>.ts` → Supabase (a table query under RLS, or `supabase.rpc(...)`).

**Database**
- Every schema change is a migration made with `npx supabase migration new <name>`.
- Migrations are idempotent anyway: `IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, `CREATE OR REPLACE FUNCTION`.
- Whoever adds a table writes its RLS policies and REVOKEs **in the same migration**.
- Only the **integrator** runs `npx supabase db push` and `npx supabase functions deploy`, so two people never push at once.
- Name an Edge Function before its first deploy; the URL slug cannot change later.

**RLS check (integrator, before each merge)**
- `supabase/checks/rls.sql`: read-only, lists every public table and confirms RLS is on, then tries each table as a logged-out user. Every row should read OK.
- Behaviour checks run inside a transaction that is always rolled back.

**Dev loop**
- `npm start`: Metro with hot reload for JS changes, on the dev build.
- Add packages with `npx expo install <pkg>`, not `npm install`: it picks the versions that match SDK 56.
- Before pushing: `npx tsc --noEmit` and `npm run lint`.
- Colors: use the Palette A class names from `tailwind.config.js` (`bg-background`, `text-foreground`, `text-muted`, `bg-primary`, `bg-accent`, `bg-secondary`, `border-border`, `text-destructive`), never hex values in screens. Orange `accent` is for badges and buttons with white text only.
- **Install every native module before the first dev build**: `@rnmapbox/maps`, `expo-location`, `expo-task-manager`, `expo-camera`, `expo-notifications`, `react-native-svg`, `react-native-qrcode-svg`. Adding one later means all three of us rebuild (`npm install`, `npx expo prebuild -p android`, `npm run android`).
- No app test suite. We test on real phones.

**Team**
- Work is split by feature, not frontend and backend. Each person owns whole role screens end to end.
- Integrator: **JM**. Merges, runs `db push`, function deploys, the RLS check and EAS builds.
- Docs: the Decisions Log in `prep-plan.md`, the feature table in its section 1, and one shared `handoff.md` (newest section on top, a short section per person before each sleep shift).

## Before building, check

1. The first **EAS dev build** works and installs on all three phones. Done on JM's phone Oct 27; Matt and Rj install it via `handoff.md`.
2. ~~Mapbox account and public token.~~ Done: the public token works, and no extra download token is needed (rnmapbox docs; the build compiled without one). Matt's style URL is still pending.
3. ~~Supabase project in Singapore, PostGIS enabled, email confirmation off, CLI linked on the integrator's laptop.~~ Done Oct 26: migration 1 pushed; live checks 22/22 OK and 31/31 PASS.
4. Background location on a real Android phone with the screen off, early.
5. Jeepney fares per destination worked out from the LTFRB per-km rates (distance of each route).

## Sources

- Expo (via Context7): SDK version table, `expo-location` background tasks and config plugin, TaskManager not in Expo Go on Android, EAS APK build profiles, local build limits, push in Expo Go
- `@rnmapbox/maps` (via Context7): not in Expo Go, config plugin, `styleURL`, `LineLayer`
- Supabase (via Context7): Expo quickstart, Edge Functions runtime (Deno, TypeScript only)
- RevenueCat (via Context7): Play Console upload needed for real purchases, Test Store limits
