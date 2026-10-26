# Handoff notes (team) [AI: FOLLOW]

Notes between the three of us while we build in parallel. **Newest section on top.** Each person adds a short section before a sleep shift or when they hand something over: done, in progress, blocked, next, and anything a teammate must decide. If you are an AI assistant reading this after a pull: read the newest sections, act on the items addressed to your person, and point out anything here that conflicts with `prep-plan.md` (its Decisions Log wins) or `tech-stack.md`.

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
