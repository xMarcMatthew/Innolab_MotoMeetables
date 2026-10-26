# TransCo: feasibility and scope (draft for the team)

Inputs: `founder/idea.md`, `founder/competitors.md`, and the Court trial (`.court/20261026-160823/VERDICT.md`, local only): **GUILTY 6 to 0 as scoped**. Conditions for acquittal: drop payment and live tracking or show them as a labelled mock; one flow (where you are, where you are going, right jeepney or tricycle, correct fare) from the 8 approved routes and the fare matrix; confirm fares and name a partner (PSO or a transport cooperative).

**Retrial on the revised plan** (`.court/20261026-164300/VERDICT.md`): **GUILTY 6 to 0 as written**, but the payment charge no longer stuck (the jury accepted the driver's own GCash/Maya QR as refining, not reinventing). What stuck: no partner or usable route data (6), too much for 14 hours with no named Must-have (4), tracking fails off stage (4). Conditions: lock the A-to-B guide with fare on the 8 official routes entered by hand; tracking, route recording and payment after hour 10; drop PayMongo; get a cooperative or LGU office to confirm routes and fares; bring a few real commuters' words and a confirmed jeepney fare. Stack: Laravel + Inertia React + Tailwind + Supabase Postgres. About 14 build hours, 3 devs.

## Feature by feature

| # | Feature | Buildable in the hackathon? | How | Catch |
| --- | --- | --- | --- | --- |
| 1a | Real cashless payment (we hold or move money) | **No** | Needs a licensed payment partner, merchant onboarding and KYC | Not doable or safe in 24 hours; also already done by beep, AFCS and QR Ph |
| 1b | "Pay the exact fare by QR" using the driver's own GCash/Maya QR Ph code | **Yes, almost free** | App computes the fare and shows "Pay P__ " next to the driver's QR Ph image; payment happens in the passenger's own wallet | We never touch money; refines what already exists (BSP Paleng-QR) |
| 1c | Simulated beep-style wallet (fake credits, tap or scan to deduct) | Yes, as a demo only | Driver phone scans passenger QR in the browser (camera); deduct from a demo balance | Must be labelled as a simulation in the pitch, or judges will ask about licensing |
| 1d | NFC card tap | Partly | Web NFC works only in Chrome on Android and only reads NDEF tags; it cannot read real beep cards (DESFire). Cheap NTAG stickers could stand in | Needs an Android phone and NFC tags on hand; demo risk |
| 2 | Fare computation, pickup to drop-off | **Yes** | Distance along the route line between two stops, then the official formula (minimum fare for first 4 km plus a per-km rate); tricycles per Naga Ord. 2024-002 | Current Bicol jeepney rate not confirmed (P14 for 4 km reported nationally in 2026): keep it as one config value and confirm with LTFRB Region V or a driver |
| 3 | Route information | **Yes** | Draw Naga's routes as lines on a Leaflet + OpenStreetMap map (free, no API key) | The 2025 route plan is a scanned PDF: someone has to trace the 8 routes by hand (1 to 2 hours). Start that first |
| 4 | Jeepney tracking with ETA | Yes, approximate | Driver opens the web app, the browser sends its location every 10 s; passengers' page refreshes; ETA = distance left on the route / average speed | Browsers stop sending location when the screen is off; real use needs a native app or a GPS device. Demo with one real phone plus simulated jeeps |
| 5 | Commute guide A to B | Single route: yes. With transfers: no | "Which route passes near both points" is a simple search; transfers need a route graph | Transfers are a Delighter at best |

## Kano scope (proposal)

**Must-have (H2.5 to H10), the one core flow:**
A commuter picks where they are and where they are going on the map, sees which jeepney route to take, where to wait, where to get off, and the correct fare.
- Routes and stops for Naga (start with 2 or 3 routes fully, then the rest)
- Fare computation
- Simple admin page where a cooperative or the city updates routes and the fare rate (this is what makes it "empower a local group")

**Satisfiers (H10 to H16):**
- Live jeepney location and ETA (driver mode)
- "Pay the exact fare" with the driver's QR Ph code (1b)
- Tricycle fare lookup from the city matrix
- PWA install

**Delighters (only if all of the above is deployed):**
- Simulated beep-style wallet with QR scan (1c) or NFC tap (1d)
- Transfers in the commute guide

**Cut:** real payment processing (1a).

## Theme fit

The brief asks to empower "a local community, non-profit organization, or grassroots movement". Commuters alone are a broad public. Name a group:
- **Naga's jeepney cooperatives and drivers' associations** (consolidated under PUV modernization): they publish routes and fares and share driver locations; drivers get fewer fare arguments.
- **Naga City Public Safety Office**: already ordered to publish a fare matrix "to guide drivers and the riding public".

## Prove it matters (do this today)

- Quick poll of 10 to 20 people at the venue or in group chats: "In the last month, did you not know the fare or which jeep to take in Naga?"
- Ask one jeepney or tricycle driver about fare arguments and the 2025 route changes.
- Screenshot the city's route plan PDF: "this is the only official source today".

## Open risks

- Route data accuracy: wrong routes are worse than none. Mark the demo data "as of the 2025 route plan".
- Sakay.ph or Google Maps could add Naga quickly; the local partner (coop or PSO) is the defense.
- If the team insists payment is the main novelty, the pitch must explain why beep, AFCS and QR Ph are not enough in Naga.
