# Matt's nap plan: onboarding, main screens, worker split [AI: FOLLOW]

Written Oct 27 before Matt's sleep shift. JM is on duty and commits. Two Opus worker chats build Matt's units from the briefs in `docs/hackathon/briefs/`; Matt's Claude chat integrates (reviews diffs, runs `npx tsc --noEmit` and `npm run lint`) and tells JM what is ready to commit. If anything here conflicts with `prep-plan.md`, its Decisions Log wins.

## Decisions (Matt, Oct 27)

| # | Decision | Why |
| --- | --- | --- |
| D1 | **No anonymous sessions.** Every user creates an account. | The long-term product needs accounts. |
| D2 | **Driver wait: local `wantsDriver` flag + "Waiting for your coop" screen.** No database change. | A new driver is a `commuter` in the database until promoted; today they land on commuter Home with no explanation. |
| D3 | **Full name always collected; other users see "Marc B."** via `shortName()` in `src/lib/names.ts`. A coop sees its own drivers' full names. | Privacy between strangers, recognisable to the coop. |
| D4 | **Three tabs per role** (Expo Router `Tabs`, `@expo/vector-icons`, active tab in primary, labels always visible, safe area respected). Sign out lives in the Account tab. | Pro Max: bottom nav of at most 5 with an active state. |
| D5 | **"Go to terminal" opens the phone's maps app** with a `geo:` link to the terminal coordinates. | Walking directions with no Directions API, no quota, one line. The jeepney route line itself still comes from `routes.route_line`. |

## Onboarding

**Welcome screen** (replaces landing on Sign in): Larga wordmark, "Know the fare before you ride.", primary **Find a ride**, secondary **I drive for a coop**, small **Sign in**.

**Commuter:** Find a ride → the existing sign-up → commuter Home. No tutorial slides; the search box carries the hint. Location permission is asked only when a screen first needs it, with one sentence; denied means terminals sort by name and the map centers on Naga.

**Driver:** I drive for a coop → explainer ("Your coop assigns you a vehicle. Create an account with the email your coop knows, or sign in if they gave you one.") → sign-up or sign-in. The phone stores `wantsDriver`. After sign-in, role still `commuter` + flag set → **Waiting for your coop** (email in large text, "Give this email to your coop. When they assign you a vehicle, tap Check again", Check again, Sign out). Role `driver` → JM's driver home, which gains a **first-trip checklist** above the status buttons (vehicle assigned; location "Allow all the time" with a settings fallback; notifications after H10; "Keep Larga open on the dashboard while on a trip"). Limit of D2: the flag lives on one phone.

**Coop / bus operator:** accounts are created by us; sign in only. Empty state on Rj's home: "Add your first terminal".

## Main screens per role

**Commuter (Matt)**, tabs Home, Trips, Account:
- Home `commuter/(home)/index`: map on the custom style with terminal dots and the user's location; "Where to?" search box over the map filtering our destination names; **Drop a pin** toggle (Rj's `PinPicker`). Choosing a destination opens Options.
- Options `commuter/(home)/options`: one card per ride option, nearest terminal first: vehicle type icon + label, terminal name, distance, status line ("2 now loading"), driver's fare when a loading vehicle has one, official guide (regular, discounted), "Above the official fare" in `text-destructive`. Tap opens Route.
- Route `commuter/(home)/route`: map with the route line (primary) and the terminal (accent), live vehicles after H10; card "Ride the jeepney from Pacol Terminal (Centro) to Pacol" with fares and status; buttons **Go to terminal** (D5), and after H10 **Scan to board** and **Pay ₱__**.
- Trips `commuter/trips`: boardings after H10; empty state until then.
- Account `commuter/account`: full name, email, Sign out.

**Driver (JM, suggestion)**, tabs Trip, QR, Account: Trip is the current screen plus the first-trip checklist and, after H10, Start trip / End trip controlling GPS sharing and a passenger count; QR shows the vehicle's boarding QR full screen (after H10); Account shows name, coop, Sign out.

**Coop (Rj, suggestion)**, tabs Terminals, Vehicles, Account: Rj's current screens, Routes and the forms as pushed screens under Terminals; Account shows the coop name and Sign out.

## File ownership during the nap

| Who | Owns (nobody else edits these) |
| --- | --- |
| Skeleton (Matt's chat, written first) | `src/app/_layout.tsx` entries, `src/app/commuter/_layout.tsx`, `src/app/commuter/(home)/_layout.tsx`, `src/lib/api/commuter.ts` types and mock loader, `src/lib/names.ts`, `src/lib/colors.ts`, placeholder screens |
| Worker A, commuter core | `src/app/commuter/(home)/index.tsx`, `options.tsx`, `route.tsx`, `src/components/commuter/*`, `src/hooks/use-destinations.ts`, `src/hooks/use-ride-options.ts`, `src/hooks/use-route-detail.ts`, function bodies in `src/lib/api/commuter.ts` |
| Worker B, onboarding and account | `src/app/(auth)/welcome.tsx`, `src/app/(auth)/driver.tsx`, `src/app/waiting.tsx`, `src/app/index.tsx`, `src/app/commuter/trips.tsx`, `src/app/commuter/account.tsx`, `src/lib/onboarding.ts`, `src/components/driver/first-trip-checklist.tsx` (component only, not wired) |
| Matt's chat | `docs/hackathon/handoff.md` (Matt's section), geocoding check |

**Already done by JM and Rj, so the workers use it instead of mocks:** `nearest_routes(p_dest_lat, p_dest_lng, p_my_lat?, p_my_lng?)` is the destination search (migrations 2 and 4); the Naga seed is in the live database (12 terminals, 19 routes with lines, 6 vehicles); `vehicle_type` includes `modern_jeepney` with labels in `VEHICLE_TYPE_LABELS`. Matt's commuter screens read everything from Supabase; `data/routes/*.json` stays as the source for re-seeding only.

**JM: free to work on without overlap.** Driver tabs (`src/app/driver/_layout.tsx`, `driver/qr.tsx`, `driver/account.tsx`), wiring `FirstTripChecklist` into `driver/index.tsx` once Worker B reports it done, the vehicles RLS fix Rj flagged, migration 2 (fare types, `requested_role` if wanted later), Firebase for push, the after-H10 RPCs (`update_my_location`, `board_vehicle`).

**One package added for the tabs:** `@expo/vector-icons` (JavaScript only, no rebuild), via `npx expo install`. Please do not edit the files in the three worker rows above until the nap ends; root `_layout.tsx` additions for driver screens are fine, add lines only.

**Nobody commits for the workers.** Each worker leaves changes in the working tree with tsc and lint clean and a Report section in its brief; JM commits per unit with the team's message format.
