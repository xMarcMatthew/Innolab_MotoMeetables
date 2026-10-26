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

1. **Stack:** Laravel (PHP) + React via Inertia + Tailwind + Supabase Postgres, deployed on Railway or Render. If the Decisions Log says we picked Alternative B (Flask + React + Supabase, section 2), follow that instead. Do not suggest other stacks unless we ask. Mobile only if section 2's Mobile Backup Plan says so.
2. **Must-haves first:** build only the Must-have features (Kano Model, section 3.3) until they work end to end and are deployed. No Delighters before that.
3. **Keep it simple:** refine an existing solution, do not reinvent. Write the smallest code that works. No features we did not ask for.
4. **Security is not optional:** auth middleware on protected routes, Form Request validation, Policies, Eloquent or query builder only (no raw SQL with user input), never commit .env.
5. **Feature freeze at H16:** after that, bug fixes only.
6. **When in doubt, ask.** If a request conflicts with this file, point out the conflict before writing code.

### Current Status [TO FILL ON THE DAY]

| Field | Value |
| --- | --- |
| **Theme** | Develop a purpose-driven digital solution that empowers a local community, non-profit organization, or grassroots movement in the Bicol Region to solve a real-world problem they face today. Find a real problem, prove that it matters, and build a working solution that people can actually use. |
| **Chosen idea (one sentence)** | A Naga City commute app (working name TransCo, rebrand pending): tells commuters which jeepney or tricycle to take, where to wait and get off, the correct fare, and where the jeepney is now. See founder/idea.md. |
| **Target users** | Two account types: **commuters** (find a ride, see fare and ETA) and **drivers** (their phone shares the PUJ's live location). Route data comes from crowdsourcing and LGUs. |
| **Core user flow** (the one flow that must work) | Commuter sets where they are and where they are going, then sees the right route, where to wait, where to get off, and the fare. |
| **Must-have features** | Route data for Naga, route and fare lookup, commuter and driver accounts. (Scope proposal in founder/feasibility.md; payment and live tracking go through third-party services.) |
| **Web or mobile** | Web (default), PWA as a Satisfier |
| **Backend** | Laravel or Flask (decide and log it in the Decisions Log) |
| **Current hour / phase** | Planning. Terminal pivot clarified by Rj (docs/hackathon/terminal-pivot.md), waiting on team review; then rewrite feasibility.md, tech-stack.md and payment-flow.md to match before scaffolding. |

## 1. How We Work [AI: REFERENCE]

- We are all full-stack, so we split work **by feature**. Each person owns a feature end to end (UI, data, logic).
- One person is the **integrator** for the main branch: merges PRs and keeps the deployed build working.
- Comms: group chat for quick stuff, this file for decisions. If it is decided, it goes in the Decisions Log.
- Mentor: use them for idea validation early and pitch rehearsal late, not as a 4th coder.

| **Feature** | **Owner** | **Status** |
| --- | --- | --- |
|  |  |  |
|  |  |  |
|  |  |  |

## 2. Tech Stack and Starter Kit [AI: FOLLOW]

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
- [ ] PHP 8.x, Composer, and Node.js LTS installed on all 3 laptops (Laragon makes this easy on Windows)
- [ ] Laravel app created with the React starter kit, pushed to the repo
- [ ] Database connected (Supabase Postgres connection string or local MySQL), migrations run
- [ ] Auth works: register, login, logout
- [ ] Hello-world deployed to Railway or Render, opens on a phone
- [ ] Everyone has cloned and run it: `composer install`, `npm install`, `php artisan serve`, `npm run dev`
- [ ] .env values shared privately, not in the repo
- [ ] **Confirm with TACTICS** if pre-built boilerplate is allowed, since the event says "build from scratch"
- [x] **Confirm with TACTICS** if AI tools like Claude are allowed (Yes, allowed)

**Time-box rule:** if setup takes more than 1 hour, fall back to React + Supabase + Vercel. Better to show up with a stack that works than fight setup during the event.

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
| **Must-have** | Without these, the app does not work or does not solve the problem. Users expect them. | H2.5 to H10 (core flow) |  |
| **Satisfiers** | The better these are, the happier users get (speed, filters, nicer UI, etc.). | H10 to H16 |  |
| **Delighters / Fun** | Unexpected extras that wow users and judges. Nobody misses them if absent. | Only after Must-haves are done, before the H16 freeze |  |

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

## 5. Pitch Structure (aim for 5 mins) [AI: FOLLOW]

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
- [ ] PHP, Composer, and Node.js already installed on every laptop (don't rely on venue WiFi)
- [ ] Expo Go installed on our phones (mobile backup plan)

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
