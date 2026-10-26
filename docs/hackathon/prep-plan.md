# Innolab Hackathon 2026 Prep

**Event:** October 26 to 27, 2026 · 24 hours · Theme revealed on the day

**Organizers:** TACTICS x ADNU MAGIS TBI

**Team:** Marc Matthew Bagasbas, John Francis Mendoza, John Marc Reantazo

**Mentor:** Ian Peter Lastimosa

**Prizes:**
- 1st: ₱8,000 + chance to join MAGIS TBI IGNITE Incubation
- 2nd: ₱4,000
- 3rd: ₱2,000

## AI Context (read this first) [AI: FOLLOW]

This file is our team's source of truth for Innolab Hackathon 2026 (24-hour build, October 26 to 27, theme revealed on the day). If you are an AI assistant (Claude Code) reading this, use it as the basis for every suggestion.

### How to read the labels

- **[AI: FOLLOW]**: decisions and rules. Follow them.
- **[AI: REFERENCE]**: background. Use it only when relevant.
- **[HUMAN ONLY]**: team logistics. Ignore it.
- **[TO FILL ON THE DAY]**: left blank until the theme drops. If it is still empty, ask us instead of guessing.
- The **Decisions Log** at the bottom is the newest information. If it conflicts with anything above it, the Decisions Log wins.

### Top rules (always apply)

1. **Stack:** Android APK in Expo SDK 56 + Expo Router + NativeWind, with Supabase as the whole backend (Auth, Postgres + PostGIS, RLS, RPCs, Realtime, Edge Functions) and Mapbox for maps. No custom server. Full details in `tech-stack.md`. Do not suggest other stacks unless we ask.
2. **Must-haves first:** build only the Must-have features (Kano Model, section 3.3) until they work end to end and are deployed. No Delighters before that.
3. **Keep it simple:** refine an existing solution, do not reinvent. Write the smallest code that works. No features we did not ask for.
4. **Security is not optional:** RLS on every table, SECURITY DEFINER RPCs (with their own `auth.uid()` and input checks) for sensitive writes, only the anon key in the app, never send the user's id from the client, never commit .env. See the Security model in `tech-stack.md`.
5. **Feature freeze at H16:** after that, bug fixes only.
6. **When in doubt, ask.** If a request conflicts with this file, point out the conflict before writing code.

### Current Status [TO FILL ON THE DAY]

| Field | Value |
| --- | --- |
| **Theme** | Develop a purpose-driven digital solution that empowers a local community, non-profit organization, or grassroots movement in the Bicol Region to solve a real-world problem they face today. Find a real problem, prove that it matters, and build a working solution that people can actually use. |
| **Chosen idea (one sentence)** | **Larga** (Bikol: to depart, "let's go"), a Naga City terminal commute app: pick where you want to go, and the app tells you what to ride (jeepney, bus or tricycle) and which terminal to go to, the fare with the official fare guide next to it, whether it is loading or has departed, and where it is now. See terminal-pivot.md. |
| **Target users** | Three account types: **commuters** (find the vehicle and fare, scan the driver's QR on boarding), **drivers** (share live location, set loading or departed), **coop / TODA** (manage terminals, fares and vehicles). The partner is a TODA or terminal coop. |
| **Core user flow** (the one flow that must work) | Commuter picks a destination (search or map pin), then sees what to ride, which terminal to go to, the fare next to the official guide, and whether one is now loading or has departed. |
| **Must-have features** | See section 3.3. |
| **Web or mobile** | Android APK (Expo dev build, EAS Build) |
| **Backend** | Supabase only, no custom server (see tech-stack.md) |
| **Current hour / phase** | **Snapshot, Oct 28 early morning (JM).** **Live database:** migrations 1 to 7 (schema and RLS; `nearest_routes` search; modern jeepney and own-coop drivers; search skips routes leaving from the pin; `update_my_location`; driver payment QR; boarding with `board_vehicle` and `my_passengers_today`) plus the Naga sample seed and the demo board (`supabase/seed/demo.sql`: 12 more sample jeeps with statuses and driver fares). Checks: `rls_behaviour.sql` 66/66, `nearest_routes.sql` 12/12, `rls.sql` 28/28 OK. **Tested on JM's phone:** login and role redirect; driver Trip tab (first-trip checklist, Start/End trip with background GPS every 5 s, status, fare), QR tab (board QR, passengers today) and Account tab; live jeeps on the commuter Route map. **Built, not yet phone-tested:** Matt's commuter search, ride options and route screens and the onboarding (Welcome, For drivers, Waiting, Trips, Account); Rj's coop screens, the driver and coop payment QR, quick trips (saved trips) on commuter Home and the shared UI components restyle; JM's Scan to board on the commuter Route screen (needs two phones) and the two live GPS review fixes (End trip offline, GPS stops when the vehicle is unassigned). **Next (JM):** one-phone test of the GPS fixes, two-phone test of Scan to board (with Matt or Rj), coop redirect test (JM's new account, promote then sign in again), the demo simulator (`scripts/simulate-jeeps.mjs`, moves 4 demo jeeps). **Next (Matt):** phone-test the commuter flow (including Rj's quick trips on Home), Rj's UI/UX findings for the commuter screens (handoff, Oct 28 4 am). **Next (Rj):** install the dev build, phone-test the coop screens and the coop payment QR, finish the UI/UX pass. Details in `handoff.md`. |

## 1. How We Work [AI: REFERENCE]

- We are all full-stack, so we split work **by feature**. Each person owns a feature end to end (UI, data, logic).
- One person is the **integrator** for the main branch: merges PRs and keeps the deployed build working.
- Comms: group chat for quick stuff, this file for decisions. If it is decided, it goes in the Decisions Log.
- Mentor: use them for idea validation early and pitch rehearsal late, not as a 4th coder.

| **Feature** | **Owner** | **Status** |
| --- | --- | --- |
| Foundation: Expo scaffold, EAS dev build on all three phones, Supabase project (PostGIS, auth, profiles and roles), all migrations and RLS, RLS check. Then driver screens (start and end trip, now loading or departed); after H10, background location and Realtime positions. **Integrator.** | JM (Reantazo) | Foundation, migrations 1 to 7 pushed, login, driver Trip, QR and Account tabs, background GPS and live map markers done; Scan to board built, two-phone test pending |
| Commuter screens: terminal picker (nearest by GPS), destination list, fare card, Mapbox map with route line and vehicle markers; Mapbox Studio style; jeepney route lines for Naga. After H10: boarding QR scan with the 100 m check, Pay screen with the coop's QR. Designer liaison and pitch deck. | Matt (Bagasbas) | Mapbox style, route files, commuter tabs, search, ride options, route screen and onboarding built (nap workers); phone test pending |
| Coop screens: terminals with pin picker, routes and fares, vehicles and driver assignment. Seed Naga terminal and fare data (photos of real fare matrices). After H10: push notifications, QR Ph entry by scanning the coop's printed code. | Rj (Mendoza) | Coop screens, Naga seed (loaded), migrations 3 and 6, driver payment QR built; phone test pending |

## 2. Tech Stack and Starter Kit [AI: REFERENCE]

**Superseded on Oct 26:** our stack is in `tech-stack.md` (Expo APK + Supabase only). The Laravel, Flask and web sections below are kept as history; do not follow them. The Setup Checklist is current.

**Stack:** one Laravel app. PHP runs the backend, Node.js (via Vite) builds the React frontend. One repo, one deploy, one auth system.

| **Layer** | **Tool** | **Why** |
| --- | --- | --- |
| Backend | **Laravel (PHP)** | Routing, validation, auth, and DB access built in. AI knows it really well. |
| Frontend | **React via Laravel React starter kit (Inertia)** | We already know React. Inertia passes data from Laravel to React pages without a separate API. |
| Build tooling | **Node.js + Vite** | Builds and hot-reloads the React side. |
| UI | **Tailwind** (included in starter kit) | Same as what we use now. |
| Auth | **Built into the starter kit** | Login, register, and password reset come ready-made. |
| Database | **Supabase Postgres** (plain Postgres connection) or **MySQL** | Laravel connects directly. No PHP SDK needed. |
| Deploy | **Railway or Render** | Vercel cannot run PHP. |
| Demo fallback | **Laragon / XAMPP** on a laptop | If deploy or venue WiFi fails, demo from localhost. |

**Standalone Node service:** only if the theme needs real-time features (live chat, live updates via Socket.io). Treat it as a Delighter, not part of the base stack.

### Supabase + Laravel: What We Use

**Rule of thumb:** Supabase is our database host. Laravel is everything else.

**Use from Supabase:**

- **Postgres database:** free hosted DB with a dashboard and table editor. No DB server to set up.
- **Storage (optional):** only if the theme needs file or image uploads. It has an S3-compatible API, so Laravel's built-in S3 driver can talk to it.

**Skip:**

- **Supabase Auth:** Laravel's starter kit already does auth. Two auth systems means two user tables, two sessions, and token-checking glue code.
- **Supabase Realtime / supabase-js in React:** if React reads Supabase directly, every table needs RLS again on top of Laravel's security. All data goes through Laravel. Only exception: a real-time Delighter, and then we write RLS for that one table.

**Connection gotcha:** Supabase's direct DB connection is IPv6 by default, which some hosts can't reach. In Laravel's .env, use the **Session pooler** connection string (Supabase dashboard → Connect) and set **DB_SSLMODE=require**. Otherwise the deploy can fail even though it works locally.

### Mobile Backup Plan (if the theme calls for a mobile app)

**Step 1: Do we really need native?** Usually no. Build the Laravel web app **mobile-first** (Tailwind responsive) and demo it on a phone. Browsers can already use the camera, GPS, and file uploads. Optional: make it installable as a PWA so it gets a home-screen icon.

**Step 2: Go native only if** the theme needs any of these:

- Push notifications
- Background location tracking
- Bluetooth, NFC, or other device hardware
- Offline-first use
- The brief or judges explicitly say "mobile app"

**Native setup:** keep the same Laravel backend, swap the frontend.

| **Layer** | **Tool** | **Note** |
| --- | --- | --- |
| Mobile app | **React Native + Expo** (NativeWind for styling) | We already know it. Tailwind-style classes carry over. |
| Backend | **Same Laravel app, as a JSON API** | Add API routes (`php artisan install:api`). Inertia pages do not work in React Native. |
| Auth | **Laravel Sanctum** (token auth) | App gets a token on login and sends it with every request. Store it in **expo-secure-store**, not AsyncStorage. |
| Database | **Same Supabase Postgres** | No change. |
| Demo | **Expo Go** on a phone + screen mirroring to the projector | Test mirroring before the pitch. Keep a backup video. |

**Optional prep (20 mins):** get a blank Expo app running on at least one phone through Expo Go, so we know the toolchain works if we need it.

### Security (now handled by Laravel, not Supabase RLS)

Laravel connects to the database as one Postgres user, so Supabase RLS no longer protects us. Instead:

- **Auth middleware** on every protected route
- **Form Request validation** on every user input
- **Policies** for "can this user edit or delete this record?"
- **Eloquent / query builder only**, no raw SQL with user input
- **.env never committed**, share secrets privately in the group chat
- CSRF protection is on by default, don't disable it

### Setup Checklist [HUMAN ONLY]

- [x] Repo created by Matt on GitHub (double-check all 3 members have push access)
- [ ] Node 22 LTS, Git, EAS CLI on all 3 laptops; Android Studio + JDK 17 on one laptop (build backup) (JM's laptop is still on Node 20.20.2: the phone works, but pressing `w` for web crashes until Node 22)
- [x] Expo SDK 56 app created (Expo Router + NativeWind), every native module from tech-stack.md installed, pushed to the repo
- [x] Supabase project created (Singapore), PostGIS on, CLI linked on the integrator's laptop, first migration pushed, email confirmation off (checked in the dashboard Oct 27)
- [ ] First EAS dev build installed on all 3 phones (JM's and Matt's done; Rj via `handoff.md`)
- [x] Auth works: register, login, logout (tested on JM's phone Oct 27)
- [ ] Everyone has cloned and run it: `npm install`, `npm start`, opens on their phone's dev build
- [ ] .env values (Supabase URL and anon key, Mapbox public token) shared privately, not in the repo
- [ ] **Confirm with TACTICS** if pre-built boilerplate is allowed, since the event says "build from scratch"
- [x] **Confirm with TACTICS** if AI tools like Claude are allowed (Yes, allowed)

**Time-box rule:** if the EAS dev build is not on the phones within 1 hour, switch to the local build (`npx expo run:android`) on the Android Studio laptop. Better to show up with a build that works than wait in a queue.

### Alternative B: Flask (Python) Stack (Mentor suggestion)

**Pick ONE backend, Laravel or Flask, and write it in the Decisions Log.** Never run both. Rule of thumb: choose the language at least one of us has actually built something with. Flask is simpler to start, but less comes built in, so auth, validation, and migrations are things we add ourselves.

| **Layer** | **Tool** | **Note** |
| --- | --- | --- |
| Frontend | **React + Vite + Tailwind** (PWA, see below) | Our comfort zone. Deploys to Vercel. |
| Backend | **Flask (Python)** as a JSON API | Small and readable. Good for server logic like AI calls or data processing. |
| Auth | **Supabase Auth** in React | Flask verifies the Supabase JWT on every protected route. No custom login system. |
| Database | **Supabase Postgres** | React can read simple data directly with RLS on. Flask handles anything sensitive or complex. |
| Deploy | **Vercel** (frontend) + **Render or Railway** (Flask) | Two deploys, so set up CORS early. |

**Laravel vs Flask at a glance:**

|  | **Laravel (main plan)** | **Flask (Alternative B)** |
| --- | --- | --- |
| Learning curve | Steeper: routes, controllers, Eloquent, Inertia | Gentler, if we know Python |
| Built in | Auth, validation, migrations, CSRF | Very little, we add libraries |
| Deploys | One app | Two apps (frontend + API) |
| Security model | Laravel middleware and Policies | Supabase RLS + JWT checks in Flask |
| Best when | Someone knows PHP/Laravel | Someone knows Python, or the idea needs Python libraries (AI, data) |

**Flask security musts:**

- **Never run with `debug=True` when deployed.** The debug console lets anyone run code on our server.
- Verify the Supabase JWT on every protected route. Never trust a user ID sent from the frontend.
- Validate every input (Pydantic or Marshmallow). Use parameterized queries or SQLAlchemy, never string-built SQL.
- RLS on for every table React touches directly.
- CORS allows only our frontend domain, not `*`.
- `SECRET_KEY` and service keys only in .env, never committed. The Supabase service role key never goes to the frontend.

### PWA: Make the Web App Installable (either stack)

A PWA lets judges and users add our web app to their phone home screen like a real app, without building a native one. Cheap win for the mobile angle.

- **Laravel:** it already uses Vite, so add **vite-plugin-pwa**.
- **Flask + React:** add **vite-plugin-pwa** to the React app.
- Needs a **manifest** (name, icons 192px and 512px, theme color) and a **service worker**. The plugin generates both.
- Needs **HTTPS**. Railway, Render, and Vercel give this for free. localhost also works for testing.
- **Only cache static files** (JS, CSS, icons). Never cache API responses with user data.
- Test before the pitch: open the deployed site on a phone and use Add to Home Screen.
- Kano bucket: **Satisfier**. Do it after the Must-haves work, about 30 minutes.

## 3. Idea Triage (first 60 to 90 mins after theme reveal) [AI: FOLLOW]

1. 15 mins: everyone brainstorms solo, no judging
2. 20 mins: share, combine, shortlist top 3
3. Score each 1 to 5 using the table below
4. Run the winner by the mentor, then lock it. No changing ideas after this.
5. Define the **one core user flow** that must work. Everything else is a bonus.

| **Criteria** | **Question** | **Idea A** (evacuation center needs board, see founder/idea-a-needs-board/) | **Idea B** | **Idea C** |
| --- | --- | --- | --- | --- |
| Impact | Real problem, real users? |  |  |  |
| Feasibility | Core flow buildable in ~14 hours? |  |  |  |
| Demo-ability | Can we show it working in 2 mins? |  |  |  |
| Incubation potential | Would MAGIS TBI back this? |  |  |  |
| **Total** |  |  |  |  |

### 3.1 Brainstorming Guide (from Matt)

Use this during the 15-minute solo brainstorm, then again when comparing ideas:

1. **Pain points:** what is actually frustrating or broken about the theme?
2. **Who is affected:** name the specific users (students, vendors, LGUs, etc.), not "everyone"
3. **Current solutions:** how do people deal with it today (apps, manual process, Facebook groups, paper)?
4. **Gaps:** what do current solutions miss? **Our idea lives in this gap.**

### 3.2 Ground Rules (from Mentor and RJ)

- **Don't be too ambitious.** Small and working beats big and broken.
- **Cheap to run:** the solution should not need a lot of money or manpower to operate.
- **Refine, don't revolutionize:** improve an existing solution rather than reinventing everything.
- **No bizarre concepts:** judges should get the idea in one sentence.
- **Feasible (RJ):** if the 3 of us cannot build the core flow in about 14 hours, it's out.

### 3.3 Scoping the MVP: Kano Model (from Mentor)

After locking the idea, sort every feature into one of these three buckets before anyone starts coding:

| **Category** | **What It Means** | **When We Build It** | **Our Features** |
| --- | --- | --- | --- |
| **Must-have** | Without these, the app does not work or does not solve the problem. Users expect them. | H2.5 to H10 (core flow) | Commuter, driver and coop accounts with roles; destination-first guide (search or pin a destination, see what to ride, which terminal to go to, the driver's fare next to the official fare guide, route line on the map) from seeded Naga data; coop screens to edit terminals, routes, fare guide and vehicles; driver sets their fare and "now loading" or "departed" |
| **Satisfiers** | The better these are, the happier users get (speed, filters, nicer UI, etc.). | H10 to H16 | Live GPS tracking (background task + Realtime); boarding QR with the 100 m check (trip record, passenger count); "Pay ₱__" with the driver's QR Ph code; push when a vehicle starts loading; the designer's Mapbox style; saved trips (mentor's idea: tap a usual destination instead of searching) |
| **Delighters / Fun** | Unexpected extras that wow users and judges. Nobody misses them if absent. | Only after Must-haves are done, before the H16 freeze | Share my ride with family; a map tab for drivers or a dispatcher map for coops (if time) |

**Rule:** no Delighter work starts until every Must-have works end to end and is deployed.

## 4. 24-Hour Battle Plan [AI: FOLLOW]

| **Time** | **Focus** |
| --- | --- |
| H0 to H1.5 | Theme reveal, idea triage, lock the idea |
| H1.5 to H2.5 | Sort features with the Kano Model (3.3), split Must-haves by person, DB schema, wireframes |
| H2.5 to H10 | Build the core flow |
| H10 | Checkpoint: core flow works end to end and is deployed? |
| H10 to H16 | Secondary features, polish, sleep shifts |
| H16 | **Feature freeze.** Bug fixes only after this. |
| H16 to H20 | Pitch deck, demo script, record a backup demo video |
| H20 to H23 | Rehearse pitch with mentor, at least 2 full runs |
| H23 to H24 | Buffer, final deploy, submit. Open the live site a few minutes before pitching so it's awake (free tiers sleep). |

**Sleep shifts:** 2 to 3 hour rotations, at least 2 people awake at all times.

## 5. Pitch Structure (8 mins presentation + 4 mins Q&A) [AI: FOLLOW]

1. **Problem:** who is hurting and why it matters (use a real stat or story)
2. **Users:** who exactly this is for
3. **Current solutions and the gap:** how people deal with it today and what those solutions miss (from our brainstorm). Shows we are refining, not reinventing.
4. **Solution:** what we built, in one sentence
5. **Live demo:** the core flow only, rehearsed
6. **Business angle:** how it could be sustainable or scale (this is what TBI cares about)
7. **Next steps:** what we would build with incubation support

**Rule:** if the live demo breaks, switch to the backup video immediately.

## 6. Packing Checklist [HUMAN ONLY]

- [ ] Laptops + chargers
- [ ] Extension cord / power strip
- [ ] Mobile hotspot / backup data
- [ ] Phone chargers, power bank
- [ ] Starter repo cloned locally (in case WiFi dies)
- [ ] Earphones
- [ ] Snacks, water, coffee
- [ ] Hoodie or jacket (venues get cold at 3am)
- [ ] Toiletries, extra shirt
- [ ] School ID
- [ ] HDMI / USB-C adapter for the projector (test it before the pitch)
- [ ] Node, EAS CLI and (one laptop) Android Studio already installed (don't rely on venue WiFi)
- [ ] Our dev build installed on our phones (Expo Go cannot run our app), plus USB cables for the local build

## 7. Decisions Log [AI: FOLLOW]

Newest information wins. Add a row for every decision.

| **Time** | **Decision** | **Why** |
| --- | --- | --- |
| Oct 26, triage | Locked the transport idea (working name TransCo) over Idea A (evacuation needs board). | Team pick. Court trial (6 to 0 as first scoped) said lead with the Naga route and fare guide, not payment. |
| Oct 26, triage | Payment and QR go through third-party services; we never hold or move money ourselves. | Real payment needs a license and per-vehicle devices; beep, GCash and QR Ph already exist. |
| Oct 26, triage | PUJ GPS tracking: driver accounts share the phone's location; Mapbox (proposed) shows it on the map. Two account types: driver and commuter. | Uses phones drivers already have; no hardware. |
| Oct 26, triage | Route data: crowdsourced, plus asking LGUs to pinpoint where routes run; stored as our own route list. | Naga's 2025 route plan is only in scanned PDFs. |
| Oct 26, triage | Name and selling point will be rebranded with the designer. | Pending. |
| Oct 26, planning | Live updates by polling (driver posts location every 5 to 10 s, commuter map re-fetches every 5 s). | Plain Laravel routes, nothing extra to deploy. |
| Oct 26, planning | Map provider: Mapbox (react-map-gl). | Map, route lines, live markers, Map Matching for recorded routes. |
| Oct 26, planning | Work split by feature; the team assigns owners. | Team decision. |
| Oct 26, payment review | Real wallet-style payment (we hold balances) is pitched as the incubation vision only. Not built, no license needed for the demo. | Needs an e-money license; incubation problem, not a hackathon one. |
| Oct 26, payment review | Two-scan flow (Option A in payment-flow.md) with its 5 fixes was agreed, then **superseded by the terminal pivot below**. Driver location every 5 s with a 15 s staleness cutoff was the tuning agreed for it. | Kept for the record; only matters if hail-anywhere jeeps come back into scope. |
| Oct 26, payment review | Demo as an Android APK (React Native + Expo on the same Laravel backend, per the Mobile Backup Plan), not a web app. Team has test devices ready. | Team decision. Background location was the trigger; with tracking dropped (below), reconfirm the APK is still worth the toolchain time. |
| Oct 26, scope pivot (**proposed, confirm next session**) | Narrow to **terminals**: jeepney, bus and tricycle terminals with fixed fare matrices and known start and end points. Core flow: pick terminal and destination, see vehicle and fare, pay through the coop or TODA QR, get a ticket QR, driver scans it once. Hail-anywhere jeeps without conductors are out of scope. Live GPS tracking replaced by dispatcher "now loading / departed". | Fixed fares remove fare computation, GPS pickup and spoofing problems. Data is a fare matrix per terminal, not traced routes. Partner is a TODA or terminal coop. Open points: confirm matrices are per destination, buses as info only (bus lines already sell tickets online), coop QR vs driver QR, say in the pitch what was dropped, re-check the APK choice. |
| Oct 26, pivot clarified (**proposed, for team review**) | Terminal pivot refined by Rj, see `terminal-pivot.md`: **live GPS tracking stays**, plus a "now loading / departed" status per vehicle. Each driver has a reusable QR issued by the app that commuters scan on boarding to link themselves to that vehicle (replaces the per-trip ticket QR). The fare matrix guide stays in the app. Driver may handle fares. Tap-in and tap-out dropped. Hail-anywhere out of scope, future work. | Supersedes the previous row where they differ. Open questions are listed in terminal-pivot.md. |
| Oct 26, stack | **Terminal pivot decided** (Rj's version, terminal-pivot.md). Open questions answered: linking to a vehicle gives a trip record and a passenger count; the driver sets loading or departed (coop users can too); fare matrix per destination only; buses info only; the app does not confirm payments. | Team pick; latest version of the pivot. |
| Oct 26, stack | **Android APK confirmed**: Expo SDK 56, Expo Router, NativeWind 4, dev build from the start, EAS Build (local `expo run:android` as backup). | Background GPS needs a dev build anyway. SDK 56 is the version set the team already knows works. |
| Oct 26, stack | **Backend: Supabase only**, no custom server (Auth, Postgres + PostGIS, RLS, SECURITY DEFINER RPCs, Realtime, Edge Functions). Replaces Laravel and Flask; top rules 1 and 4 and section 2 updated. | Team's comfort stack. One service, one language, nothing to host. Security moves into RLS. |
| Oct 26, stack | **Map: Mapbox via @rnmapbox/maps** with the designer's style; route lines stored once, no Directions or Map Matching. Replaces the react-map-gl row. | react-map-gl is web only. Fixed terminal routes need no live routing. |
| Oct 26, stack | **Live updates: Supabase Realtime**. Driver's background task sends location about every 5 s; a vehicle hides after 15 s without an update. Replaces the polling row. | Built into Supabase, no polling code. |
| Oct 26, stack | **Payment**: one `payment_qr` text per vehicle, the coop's QR Ph code by default; app shows the fare next to it; no confirmation; cash always fine. **Boarding**: reusable QR per vehicle, accepted only within about 100 m of the vehicle's live position. | We never hold money. The distance check stops photo-of-the-QR misuse. |
| Oct 26, stack | **No RevenueCat.** Business model for the pitch: coops or the LGU pay per terminal, commuters ride free. | $9.99 a month is about 40 jeepney fares; real purchases need the Play Store. |
| Oct 26, stack | **Workflow** from the team's other Expo + Supabase app, setup knowledge only, no code copied (team considers this within the build-from-scratch rule). Supabase CLI for migrations and functions; the integrator runs `db push`, deploys and the RLS check. Push notifications after H10. | Saves setup time without reusing code. |
| Oct 26, branding | **App name: Larga** (Bikol: to depart, to leave, "let's go"). Replaces the working name TransCo everywhere. | Team pick with the designer. One Bikol word that is the moment the app is about: the vehicle leaving the terminal. |
| Oct 26, branding | **Colors: Palette A, transit blue.** Flat design, light mode only, system Roboto. Tokens: primary `#2563EB`, accent `#EA580C` (now loading, Pay, Start trip), secondary `#0891B2`, background `#F8FAFC`, foreground `#0F172A`, muted text `#475569`, border `#E4ECFC`, destructive `#DC2626`. Statuses and vehicle types always carry a text label or icon, never color alone. | UI/UX Pro Max "Public Transit Guide" match; reads as official for coop and LGU customers. Orange is for badges and buttons only (3.0:1 on white), never small text. |
| Oct 26, research | **Jeepney fares come from the LTFRB national rates** (from Sept 28, 2026: traditional ₱14 for the first 4 km + ₱2/km, modern ₱17 + ₱2.40/km, 20% discount); no coop matrix needed. Tricycles stay on Naga Ord. 2024-002. Research backing is in `research.md`. | Naga's fare ordinances cover tricycles only; jeepney fares are set by the LTFRB. |
| Oct 26, core flow | **Destination first**: the commuter picks where they want to go, by searching a place and picking from the results or by dropping a pin on the map (like Google Maps). The app answers what to ride and which terminal to go to. **Drivers set their own fare**; the coop's fare matrix stays as the **official guide** shown next to it, and a fare above the guide is labelled. No in-app report: commuters use the guide to dispute it themselves. **Buses are back in full**: bus operators register like coops and get the same features. Replaces "pick a terminal first" and "buses info only". | Commuters know where they are going, not which terminal serves it. Drivers keep pricing freedom while the guide protects commuters. Buses are possible partners too. |
| Oct 26, scaffold | **Stay on Expo SDK 56** although expo-doctor flags a known Hermes V1 memory regression (fixed in SDK 57). Upgrade only if the driver phone crashes or slows during the long GPS test. | SDK 57 needs Node 22.13+ on every laptop and an untested NativeWind and rnmapbox combination; demo sessions are short and the app can be restarted before the pitch. |
| Oct 26, scaffold | Android package `com.motomeetables.larga`; the EAS project is owned by the Expo organization **motomeetables** (`owner` in app.json), not a personal account. App code under `src/`, one plain route folder per role (`src/app/commuter`, `driver`, `coop`). | The package name is permanent once signed. The org lets all three of us see builds. Plain folders avoid three `(group)/index.tsx` files all claiming `/`. |
| Oct 26, database | **Migration 1 pushed.** Locations stored as plain `lat`/`lng` numbers, not PostGIS columns; PostGIS only inside distance functions. Sign-ups are always commuters; the integrator promotes coop, bus operator and driver accounts in the SQL Editor (safe default while Rj's "bus operators register" question is open). Coop users read their own coop's drivers. `supabase/checks/rls.sql` and `rls_behaviour.sql` run before each merge. | Supabase returns PostGIS columns as hex the app cannot plot. Self-chosen roles would let anyone edit fare guides. Reviewed with /ponytail-review, /security-review and Supabase's advisor (4 expected warnings, no errors). |
| Oct 27, login | **Login and roles in the app.** Email and password sign-in and sign-up (full name goes to `profiles` through the sign-up trigger). Expo Router's `Stack.Protected` in the root layout keeps logged-out users on sign-in and logged-in users off it; `src/app/index.tsx` reads your own `profiles.role` and redirects to `/commuter`, `/driver` or `/coop`. Screens do not check the role themselves. `@hookform/resolvers` pinned to 5.9.2. | RLS already blocks every write a wrong role could try, so per-screen role checks add nothing for the demo. Resolvers 6.0.0 fails to install (peer conflict). Tested on JM's phone; the driver redirect was tested with the driver screen, the coop redirect not yet. |
| Oct 27, search | **Destination search agreed with Matt and live (migration 2, `nearest_routes`).** The pin is matched to each route's **line** (the nearest point along it), or to its destination when a route has no line. No distance cutoff: the 10 closest routes always come back with how far each drops you. One row per route; drops within 100 m tie, then the terminal nearest the commuter wins. Route lines and vehicle status are separate reads. `routes.route_line` must be a GeoJSON LineString with 2 or more points. | Jeepneys pass places on the way, so the destination point alone misses most matches. Showing far routes with their distance beats an empty list. Status stays separate so it can update live (Realtime after H10) without a new search. One bad line would break every search. Security review clean; checks 11/11. |
| Oct 27, fares | **Option A: a `modern_jeepney` vehicle type** (migration 3, written by Rj, reviewed and pushed by JM). `jeepney` means the traditional jeep; a route served by both gets one `routes` row per type with its own official fare. Same migration: a coop can assign only a driver of its own coop. Bus operator sign-up still open (we create those accounts). | Traditional and modern jeeps have different LTFRB fares (₱14 vs ₱17 base). Before this, a coop could put another coop's driver on its vehicle (Rj's find). Checks 36/36 on the live database. |
| Oct 27, seed | **Rj's Naga sample seed is loaded on the live database** (sample coops, real Naga points from Matt's route files, LTFRB and Ord. 2024-002 fares). **Search skips a route whose terminal is within 300 m of the pin** (migration 4). **Known limit:** a route that passes the pin shows its full-route fare (a Carolina jeep through Pacol shows ₱32.80, not about ₱24). | With the seed, a pin at Pacol listed Pacol to Centro first, because its line starts at Pacol. Fare to the drop point would need the distance along the line; later, and said in the pitch. Checks 12/12, 36/36, 23/23. |
| Oct 27, live GPS | **Driver location sharing built** (migration 5, `update_my_location`): Start trip runs a background location task about every 5 s with a pinned notification and keeps going with the screen locked or the app swiped away; End trip stops it and sets Off duty; Sign out ends a running trip first. Worker B's first-trip checklist sits above it on the driver screen. | Tested on JM's phone (positions kept updating while locked and after swipe-away). The vehicle comes from the login, never the app. Battery over a long trip not tested yet. RLS 44/44. |
| Oct 27, live map | **Live jeeps on the commuter Route map**: `useVehiclePositions(routeIds)` loads once, then follows Realtime on `vehicle_positions` and `vehicles`; a jeep silent for 15 s is hidden. `<LiveVehicles>` draws a dot with "plate · status"; placeholder look until the designer's vehicle icon. Wired into Matt's marked slot in `route.tsx` (2 lines, JM's call while Matt slept). | Staleness uses the time the phone received each fix, so phone clocks cannot hide or keep a jeep. Tested on JM's phone with the SQL Editor as the driver. |
| Oct 27, scope | **The coop / TODA role stays, as a back office.** The live demo shows only the commuter and driver flows; the coop screens (terminals, routes and fare guide, vehicles and drivers, dispatcher status) are shown for about 20 seconds or on one slide. Nothing built is removed. | Considered dropping coops for a simpler 2-role demo. Kept because the TODA or coop is the community organization the theme asks us to empower, it pays in the business model, and the official fare guide only protects commuters if an authority maintains it, not drivers. |
| Oct 27, payment | **The driver is the commuter's payment contact** (migration 6, Rj; reviewed and pushed by JM): the driver saves their own QR Ph code with `set_my_payment_qr`; `payment_qr_by_driver` shows the coop who set it. Replaces "coop's QR Ph code by default". | Follows the scope row: the coop is a back office, so the commuter pays the person driving. We still never hold money. RLS 53/53. |
| Oct 27, mentor (**decided, built by Rj**) | **Saved trips**, the mentor's suggestion: like Grab's saved places, a commuter taps a usual destination ("Pacol", "Work") instead of searching. Satisfier, commuter side (built by Rj in Matt's screens, with his heads-up). Built as quick trips: up to 3 chips above the Home search (pinned, then picked twice or more, then recent), stored on the phone only. Stored in AsyncStorage (no database change), each opening the same ride options as a search; a `saved_places` table with RLS only if they must follow the account to another phone. | Most commuters repeat the same few trips; one tap to the ride options is the quickest win on the core flow. Phone-only storage needs no migration and works signed in or not. Build it after the Must-haves are phone-tested. |
| Oct 27, boarding | **Boarding is live** (migration 7): every vehicle has a board token (a trigger makes one for each new vehicle). `board_vehicle(token, lat, lng)` saves a trip only for a commuter within 100 m of the vehicle's position, which must be under 30 s old; the same vehicle again within 10 min is refused. Refusals carry codes the app can tell apart (`LG001` not sharing location, `LG002` too far, `LG003` already boarded) and plain messages. Drivers see a count only, through `my_passengers_today` (since midnight Manila time), never who boarded. Driver **QR tab** shows the board QR and the count (refreshes every 5 s). | The distance check stops a photo of the QR being used elsewhere; the commuter's location is never stored. A count-only function instead of a driver read rule on `boardings` keeps commuters private. Known limit: the commuter's phone reports its own location, so a spoofed GPS passes. Security review clean; RLS 66/66, 28/28 OK. QR tab tested on JM's phone. **Scan to board** (Oct 28) is in Matt's slot on the commuter Route screen: it takes a fresh, high-accuracy GPS fix (not the 5-minute-old one used for sorting) and shows the server's message as is; built, not phone-tested yet (needs a second phone). |
| Oct 28, scope | **Push notifications cut** (Satisfier; pitch it as next steps). **The demo runs on the dev build**, no standalone APK: serve it with `npx expo start --no-dev --minify` (production JS, no warning boxes) and put the laptop and phones on a phone's hotspot, not the venue Wi-Fi. | Push needed Firebase, a `push_tokens` migration, an Edge Function, a trigger, a Vault secret and a rebuild on all three phones, while the Must-haves are not yet phone-tested end to end. The APK time goes to improvements instead (JM's call); the risk is that the demo needs the laptop running Metro. |
| Oct 28, demo data | **Demo board** (`supabase/seed/demo.sql`, JM): 12 more sample jeeps (`SMP-1003` to `SMP-3002`, fixed ids starting `0de30000-`) on the Pacol, Carolina, Panicuason and San Felipe routes, a mix of Now loading, Departed and Off duty, driver fares equal to the guide except SMP-1005 and SMP-2004, which are above it so "Above the official fare" shows. Rj's `naga.sql` is untouched; an undo block removes only demo rows. Next: a **simulator** that moves 4 of them (SMP-1003, SMP-1006, SMP-2003, SMP-2007) along their route lines as demo driver accounts, through `update_my_location`. | Before this, every jeep was Off duty with no driver fare, so the fare guide label and the status counts never showed in a demo. Tested rolled back (run twice, 6/6) and live; checks 66/66, 12/12, 28 OK after loading. The pitch says the moving jeeps are simulated. |
