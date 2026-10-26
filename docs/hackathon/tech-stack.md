# Tech Stack (proposal, not yet decided) [AI: REFERENCE]

Proposal for the commute app (working name TransCo, rebrand pending). Once the team agrees, the decisions go in the Decisions Log in prep-plan.md and this label changes to [AI: FOLLOW]. Researched 2026-10-26 with Context7 and official docs.

## The short version

| Layer | Pick | Why |
| --- | --- | --- |
| App | **Laravel React starter kit** (Laravel 13, Inertia 3, React 19, TypeScript, Tailwind 4, shadcn/ui) | Our planned stack; auth comes ready. Needs **PHP 8.3+** on every laptop. |
| Database | **Supabase Postgres** (session pooler, `DB_SSLMODE=require`) | As planned in prep-plan section 2. No PostGIS needed: route lines are stored as GeoJSON. |
| Map (decided) | **Mapbox GL JS via `react-map-gl/mapbox`** | Map, route lines, moving jeepney markers. Free up to 50,000 map loads a month. |
| Route snapping | **Mapbox Map Matching API** | Turns a driver's noisy GPS trace into a clean road-following route line. Free up to 100,000 requests a month. |
| ETA | **Mapbox Directions API** (or distance left on the route divided by average speed) | Free up to 100,000 requests a month. |
| Fare and distance math | **Turf.js** | Distance along a route between two points, nearest point on a route. |
| Live updates (decided) | **Polling every 5 seconds** | Drivers send location, commuters re-fetch. At most a few hundred jeepneys; no WebSocket server to run. |
| Payment | **Driver's own GCash or Maya QR Ph code** (real use) and **PayMongo QR Ph in test mode** (demo only, optional) | See "Payment" below. |
| Deploy | Railway or Render | Must be HTTPS: browser location and screen wake lock only work over HTTPS. |

## How each feature works

### Accounts (two types, plus admin)
- One `users` table with a `role`: `commuter`, `driver`, `admin` (cooperative or LGU staff who approve routes and set fares).
- Starter kit handles register, login and password reset. We add the role and a Policy per action.

### Live PUJ tracking (driver and commuter)
1. Driver logs in, picks their route and plate, taps **Start trip**.
2. The page asks for location permission and calls `navigator.geolocation.watchPosition`, sending the position to Laravel every 5 to 10 seconds.
3. It also requests a **screen wake lock** so the phone screen stays on. Browsers pause location when the screen turns off or the tab is hidden, so the driver's phone must stay on that page (mounted on the dashboard, charging).
4. Commuter's map re-fetches active jeepneys on that route every 5 seconds and moves the markers.
5. Driver taps **End trip**; their location stops being shared and is no longer shown.

Mapbox does not track anything by itself: the phone's GPS gives the position, Mapbox draws it and estimates arrival time.

Limit to say out loud in the pitch: a web page cannot track in the background. A real rollout would wrap the driver page in a native app or use a GPS device per jeepney.

### Routes (crowdsourced and from LGUs)
- **Record a route:** a driver taps **Record route** and drives it; the GPS points are sent to the Map Matching API (100 points per request, so long trips are split) and come back as a clean line along real roads. Saved as a draft.
- **Draw a route:** an admin draws or fixes a route on the map (for routes the LGU points out).
- **Approve:** an admin approves drafts before commuters see them. Unapproved crowdsourced routes are never shown as official.

### Route and fare lookup (the core flow)
1. Commuter sets where they are (GPS or tap the map) and where they are going.
2. The app finds approved routes that pass near both points.
3. Shows where to wait, where to get off, and the fare: distance along the route between the two points (Turf.js), then the fare rule (minimum fare for the first km band plus a rate per extra km).
4. Fare rules live in a `fare_rules` table an admin can edit (jeepney, tricycle, discounted). The current Bicol jeepney rate is **not confirmed yet**: confirm with LTFRB Region V, the city PSO or a cooperative.

### Payment (third party, we never hold money)

The team's two-scan (tap-in, tap-out) idea, its fixes and alternatives are in `payment-flow.md`; not decided yet.

- **Real-world version:** each driver uploads their own GCash or Maya QR Ph code. At the end of a lookup the app shows "Pay P__" next to that QR; the passenger pays from their own wallet. We never touch the money. We also cannot confirm the payment happened.
- **Demo version (optional):** PayMongo QR Ph in **test mode** creates a QR for the exact fare and reports "paid" back to us through a webhook, so the driver screen can show a check mark.
  - Test mode moves no money, but PayMongo warns its test QR codes are real: **never scan them with a real wallet**, it processes a real payment. Use the `test_url` to simulate payment.
  - In live mode the money goes into whoever owns the PayMongo account. If that is us, we would be holding passengers' money, which goes against our decision. Live use only makes sense if each cooperative has its own account.
  - Not confirmed: whether test keys are available before PayMongo verifies the account.

## Security (non-negotiable, per CLAUDE.md)
- Location updates: auth middleware, a Policy so a driver can only update their own active trip, Form Request validation (latitude -90 to 90, longitude -180 to 180), and throttling.
- Fares used for payment are computed on the server, never trusted from the browser.
- Mapbox: only a **public** token in the frontend, restricted to our domains in the Mapbox account. Any secret token and the PayMongo secret key stay in `.env`.
- PayMongo webhooks: verify the signature before marking anything paid.
- Commuters' locations are used in the browser only and never stored. Drivers' locations are stored only during an active trip.

## Data (first draft)
- `users` (role)
- `routes` (name, vehicle type, GeoJSON line, status draft/approved, source crowdsourced/LGU/admin)
- `fare_rules` (vehicle type, base fare, base km, per km, discount)
- `trips` (driver, route, plate, started_at, ended_at)
- `trip_locations` (trip, lat, lng, recorded_at); keep only recent points
- `route_traces` (driver, raw points) for crowdsourced recording

## Before building, check
1. Everyone has **PHP 8.3+**, Composer and Node installed (starter kit requirement).
2. Someone creates a **Mapbox account** and a public token (whether a credit card is needed at sign-up was not confirmed).
3. Test location on a real phone over **HTTPS** early (deployed preview), since localhost on a laptop does not prove the phone flow works.
4. Fallback if Mapbox sign-up blocks us: `react-map-gl/maplibre` with free OpenStreetMap-based tiles; same components, no Map Matching API.

## Sources
- Laravel React starter kit (via Context7): `/laravel/react-starter-kit`
- react-map-gl (via Context7): `/visgl/react-map-gl`
- [Mapbox pricing](https://www.mapbox.com/pricing), [Map Matching API](https://docs.mapbox.com/api/navigation/map-matching/)
- [MDN watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition), [MDN Screen Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [PayMongo QR Ph API](https://developers.paymongo.com/docs/qr-ph-api), [PayMongo testing](https://docs.paymongo.com/docs/payment-acceptance-testing)
