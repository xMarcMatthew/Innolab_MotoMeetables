# Plan: commuter demo fixes (Matt) [AI: FOLLOW]

Items Matt wants done before the pitch. Written Oct 27. Items 1 to 4 are the commuter Home only, no database change. Items 5 and 6 share one migration (8), which JM reviews and pushes.

**Status (Oct 27, 7:45 am, after JM's demo board):** items 1, 2, 4, 5 and 6 are **built, reviewed, tsc and lint clean, not phone-tested**, in the working tree (three worker chats, briefs and Reports in `briefs/worker-db-drop-fares.md`, `worker-commuter-demo.md`, `worker-driver-map.md`). Migration 8 (`supabase/migrations/20261027093000_drop_points_and_fares.sql`) is written but **not run anywhere yet**: JM runs the rolled-back pre-push test (expected `nearest_routes.sql` 19/19, `rls_behaviour.sql` 75/75, `rls.sql` 30 OK) and pushes. **Scan to board fails until it is pushed** (the app now calls the 5-argument `board_vehicle`); everything else degrades to today's behaviour. Item 3 (more routes) is Matt's data, not started. Demo numbers from `data/routes/*.json`: the Sports Complex is about 620 m from the Pacol, Carolina and Panicuason lines at 6.9 km along, so a traditional jeep shows about ₱19.80 (modern ₱23.96) against the ₱24.20 full-route guide; the San Felipe line is 1.8 km away and lists last.

## 1. Search real places, not only our destination names

**Today:** `src/app/commuter/(home)/index.tsx` filters `routes.destination_name` (Pacol, Centro, ...). "Sports complex" or "Ateneo Pacol" return "No destination called ... yet".

**Goal:** typing a Naga place name lists it, and picking it opens Options with that place's point, so `nearest_routes` picks the Pacol route for anything along Pacol.

**Checked Oct 27 (Matt's laptop, our public token):** the Mapbox **Search Box API** `forward` endpoint knows Naga landmarks. "Sports complex" returns Naga City Sports Complex (13.6467, 123.2369) first; "SM City Naga", "People's Mall" and "Ateneo" resolve; the Pacol campus is listed as **"Ateneo de Naga University - Bonoan Campus"** (13.6461, 123.2354), so the demo types "Ateneo" or "Bonoan", not "Ateneo Pacol" (that returns the barangay). The earlier Geocoding v6 failures do not apply to Search Box.

**What is needed:** nothing new. The request is a plain `fetch` to
`https://api.mapbox.com/search/searchbox/v1/forward?q=<text>&proximity=123.1948,13.6218&country=ph&limit=5&language=en&access_token=<EXPO_PUBLIC_MAPBOX_TOKEN>`.
No session token, no extra token scope, no package, no database change. Each feature has `geometry.coordinates` as `[lng, lat]` and `properties.name`, `place_formatted`, `feature_type`. Billed per request after the free allowance; a demo is a few dozen requests.

**Build:** in `src/lib/api/commuter.ts` add `searchPlaces(query)` returning the existing `Destination` shape (`name`, `lat`, `lng`). Home debounces the typed text (about 300 ms, 3 or more characters) and shows our destination-name matches first, then the Mapbox results, in the same list. Picking one no longer navigates straight away: it drops the pin on the Home map (see item 2) and shows the "Show rides" card.

**Verify:** type "Sports" on the phone, pick Naga City Sports Complex, the pin lands on the Home map; Show rides lists Centro to Pacol first with the fare guide. A place far from every route still says "No terminal serves that spot yet" (the 2 km cutoff in `listRideOptions`).

## 2. No terminal dots on Home before a search

**Today:** Home loads every terminal (`listTerminals`) and draws orange dots plus a camera frame around them on open.

**Change (decided Oct 27):** remove the terminal dots, the `bounds` and `listTerminals` from Home and `useDestinations` (`listTerminals` has no other caller). The camera opens on Naga at zoom 12. The one `ShapeSource` + `CircleLayer` stays but now draws **a single pin**: the place the commuter picked from search, or the point they tapped on the map. Under the map a card shows the pin's name (or "Pinned spot") and a **Show rides** button that pushes to Options with `lat`, `lng`, `label` as today. The "is this destination near one of our routes" check stays where it already is: Options only lists routes that drop you within 2 km, and the Route screen draws the terminal, destination and line.

**Drop a pin, reduced:** the separate full-screen `PinPicker` mode and the rectangular "Drop a pin" button go. Tapping the Home map (`MapView onPress`) sets the pin at that point, same card, same button. `PinPicker` itself stays for the coop terminal and route screens. Placeholder text becomes "Where to? e.g. Sports complex" and the card says "or tap the map".

**Near me, reduced:** a round 48 px icon-only button (crosshairs icon, `accessibilityLabel="Near me"`) in the bottom-right corner, same `nearMe` function.

**Verify:** open Home signed in, no dots; search "Ateneo", pick Bonoan Campus, pin appears; Show rides lists the Pacol route; Route shows its line and terminal. Tap the map elsewhere, pin moves, Show rides works with "Pinned spot".

## 3. More point-to-point routes (Matt adds the data)

No code. Each new route needs a `terminals` row (or an existing one), one `routes` row per vehicle type with the official fare, and `route_line` as a bare GeoJSON LineString with 2 or more points, `[lng, lat]` order. Add them to `supabase/seed/naga.sql` (JM runs it) or through the coop screens. Remember the two search rules: a route whose terminal is within 300 m of the pin is skipped, and a route that passes the pin shows its full-route fare (known limit, said in the pitch).

## 4. "Near me" button

Explained in chat on Oct 27: it asks for location, shows the blue "you are here" dot and recenters the map at zoom 15. It searches nothing. It also grants the location permission Options uses for "you to the terminal" distances. **Decided:** keep it as a round icon-only button (item 2).

## The flow we are building (Matt, Oct 27), next to Grab's

Grab, Angkas and JoyRide: search a destination, pin the pickup, get an upfront fare per vehicle class, a driver accepts, track them to you with an ETA, ride, pay. Larga is the same shape for PUJs with fixed routes, so there is no booking, no acceptance and no matching: the route and the fare guide are published up front, and the commuter goes to the vehicle.

| Step | Grab | Larga | In the code today |
| --- | --- | --- | --- |
| 1. Destination | Search a place | Search a place or tap the map (items 1 and 2) | Destination names only; Search Box fix planned |
| 2. Pickup | Pin where you are | Your GPS only sorts terminals; no pickup pin | `nearest_routes` with `p_my_*`, "x km away" on Options |
| 3. Options | Fare per vehicle class | Routes that pass near the destination, each with its terminal, vehicle type, driver fares and the official guide | Options screen, 2 km drop cutoff, 300 m terminal skip |
| 4. Where to board | Driver comes to you | **MVP: terminal only.** "Go to terminal" opens the maps app. Round trips (wait along the route) are not covered yet | Route screen; every route row is terminal → destination |
| 5. Tracking | Driver's position and ETA to you | Registered drivers' live positions on the route line, so you see jeeps moving along the route you will take. No ETA | `LiveVehicles` on the Route screen, 15 s staleness; JM's `scripts/simulate-jeeps.mjs` moves 4 demo jeeps |
| 6. Boarding | Driver confirms pickup | Scan the driver's QR within 100 m | `board_vehicle(token, lat, lng)` saves commuter, vehicle, time |
| 7. Drop-off | Driver sees the destination and navigates | **The scan sends the commuter's destination; the driver's map shows the approximate drop point on the route line (never off route)** | **Not built.** `boardings` has no destination; the driver sees a count only (`my_passengers_today`); no driver map tab |
| 8. Fare | Upfront, by distance | Driver's fare next to the guide; today the guide is the full-route fare even if you drop early | `FareLines`; known limit in the Decisions Log |

**Why the 300 m skip (step 3):** every route row runs one way, terminal → destination, and the search measures the pin against the whole line, whose first point is the terminal. Without the skip, a pin at Pacol matched "Pacol → Centro" at 0 m, because that line starts at Pacol. A jeep cannot take you to the place it leaves from, and 300 m is a short walk, so that route is dropped and "Centro → Pacol" comes first. Once routes have a return direction (round trips, later), the same rule picks the direction that ends near you.

## 5. Drop-off on the driver's map (decided Oct 27, needed for the demo)

Step 7 above. The demo shows the driver account, so the driver must see where boarded passengers get off. All on existing pieces, one migration (8) plus one screen:
- `board_vehicle(token, lat, lng, dest_lat, dest_lng)`: the Route screen already holds the destination as `lat`, `lng`. The function snaps it to the vehicle's route line (`ST_ClosestPoint`, the geometry `nearest_routes` already builds) and stores `drop_lat`, `drop_lng` on the boarding. Never off the route by construction. The commuter's own position is still used for the 100 m check only and never stored.
- `my_drop_points_today()`: the driver's vehicle's drop points since midnight Manila, **points only, no commuter ids**, so the "count only, never who boarded" decision holds.
- Driver **Map** tab (Trip · QR · Map · Account): the route line, the jeep's own position and the drop points, refreshed every 5 s like the QR tab. `LiveVehicles` and the Route screen's line drawing are the pieces to reuse.
- Scan to board passes the destination through; "Boarded SMP-1001" gains "Getting off near <place>".

## 6. Fare from the terminal to your drop point (decided Oct 27)

**Today:** one official fare per route, the full-route fare, even if you get off earlier (Options says so in its footer). Rj seeded each guide with `base + rate × (km − 4)`, fractional km, two decimals, discounted `× 0.8` (for example 13.4 km modern: 17 + 2.40 × 9.4 = 39.56).

**Rule (LTFRB rates from Sept 28, 2026, `research.md`; tricycles Ord. 2024-002):**

| Vehicle type | Fare to the drop point | Discounted |
| --- | --- | --- |
| `jeepney` (traditional) | ₱14 for the first 4 km, then ₱2.00 per km | × 0.8 |
| `modern_jeepney` | ₱17 for the first 4 km, then ₱2.40 per km | × 0.8 |
| `tricycle` | flat, the route's guide fare (₱15) | the route's discounted guide |
| `bus`, or any route with no line | the route's guide fare as seeded | as seeded |

Same formula as the seed, so a drop at the end of the line equals the seeded guide to the centavo. Distance is along the line from the terminal: `ST_LineLocatePoint(line, pin) × ST_Length(line::geography)`. A pin past the end gives the full fare.

**Where:** in `nearest_routes` (migration 8, same file as item 5), new columns `drop_lat`, `drop_lng`, `drop_km`, `fare_regular`, `fare_discounted`. The fare comes from the database, never the client, as the security model asks. The six rate numbers live in the function with a `shortcut:` comment (move to a table when the LTFRB changes them or coops need to edit).

**Shown:** on Options and Route, per route, as the headline: "Fare to Sports Complex ₱16.00 · ₱12.80 discounted (5.0 km)". The existing `FareLines` (driver's fare vs the full-route guide, "Above the official fare") stays under it, because the driver's fare is set for the whole route. The "even if you get off earlier" footer goes.

**Verify:** Sports Complex via the Pacol route shows a fare below the ₱24.20 full-route guide; a pin at Pacol itself shows exactly the seeded guide; a tricycle route shows ₱15 whatever the pin.

**Out of scope, said in the pitch:** round trips and hailing along the route, ETA, pickup pin, driver acceptance.

## Order

1. Items 1 and 2 together: `feat(commuter): search Naga places and pin them on the home map`.
2. Migration 8 (items 5 and 6, one file, rolled-back pre-push test with `rls_behaviour.sql` and `nearest_routes.sql` updated), JM pushes: `feat(db): drop points and fare to the drop point`.
3. Options and Route show the drop fare; Scan to board sends the destination: `feat(commuter): show the fare to your drop point`.
4. Driver Map tab: `feat(driver): show today's drop points on a map`.
5. Matt's data for item 3.
