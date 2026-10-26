# Handoff notes (team) [AI: FOLLOW]

Notes between the three of us while we build in parallel. **Newest section on top.** Each person adds a short section before a sleep shift or when they hand something over: done, in progress, blocked, next, and anything a teammate must decide. If you are an AI assistant reading this after a pull: read the newest sections, act on the items addressed to your person, and point out anything here that conflicts with `prep-plan.md` (its Decisions Log wins) or `tech-stack.md`.

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
- Route lines are stored as GeoJSON in `routes.route_line`; GeoJSON coordinates are **[lng, lat]**. Checked: `data/routes/pacol-centro.geojson` and `san-felipe-centro.geojson` already use that order.
- Matching a pinned or searched destination to the nearest served destination needs a small database function; tell JM the inputs and outputs you want and JM adds it in a migration.

### Next (JM)
Login and roles: sign-in and sign-up screens, and the role picker replaced by a redirect to each role's home by `profiles.role`. Your screens can then rely on a signed-in user.

### Later
- **Firebase** (`google-services.json`) for push: after H10, one rebuild.
- After-H10 database functions: `update_my_location`, `board_vehicle`, `push_tokens`.
