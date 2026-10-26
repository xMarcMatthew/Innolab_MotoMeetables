# Worker DB brief: migration 8, drop points and the fare to the drop point

You are writing one Supabase migration and updating two check files for **Larga**, a Naga City terminal commute app (Supabase: Postgres + PostGIS, RLS, SECURITY DEFINER RPCs). Read this whole file, then `docs/hackathon/plan-matt-demo.md` (items 5 and 6 and "The flow we are building"), then the existing migrations in `supabase/migrations/` (all seven, they are short) and the two check files. This file is your whole brief.

## Ground rules
- **Own only these files**: one new file `supabase/migrations/20261027<HHMMSS>_drop_points_and_fares.sql` (pick a timestamp later than `20261026203413`), `supabase/checks/nearest_routes.sql`, `supabase/checks/rls_behaviour.sql`.
- **Never edit** anything under `src/`, `supabase/seed/`, the older migrations, `scripts/`, docs.
- **You cannot run SQL here.** The Supabase CLI on this laptop is signed in to a different account, and there is no local Postgres. Write the SQL so it is right the first time: reread every statement, check each function's argument list against every call in the check files, and keep the style of the existing migrations (idempotent: `drop ... if exists` before create, `create or replace`, `set search_path = ''`, schema-qualified names, PostGIS through the `extensions` schema as the existing functions do). JM will run the rolled-back pre-push test and `db push`.
- No git commits. Append a `## Report` section at the bottom of this file: what you wrote, the exact expected tallies of the two check files, and anything JM must know. Under 15 lines.

## Contract (fixed; the app workers are building against it right now)

```sql
-- nearest_routes: same 11 columns in the same order as migration 4, then these five appended
drop_lat        double precision  -- the point on the route line nearest the pin (the destination point when the route has no line)
drop_lng        double precision
drop_km         double precision  -- along the line from the terminal to that point, km; null when the route has no line
fare_regular    numeric           -- fare from the terminal to the drop point (rule below); the route's guide_fare_regular when it cannot be computed
fare_discounted numeric           -- round(fare_regular * 0.8, 2) when computed; else the route's guide_fare_discounted

board_vehicle(p_token text, p_lat double precision, p_lng double precision,
              p_dest_lat double precision default null, p_dest_lng double precision default null) returns uuid

my_drop_points_today() returns table (lat double precision, lng double precision)

alter table public.boardings add column if not exists drop_lat double precision, add column if not exists drop_lng double precision;  -- nullable, with the same range checks as other lat/lng columns (see migration 1)
```

## Rules to implement

**Snap and distance.** Build the line with `extensions.st_setsrid(extensions.st_geomfromgeojson(route_line::text), 4326)` as the existing function does. Fraction along the line: `extensions.st_linelocatepoint(line, pin)`. Drop point: `extensions.st_lineinterpolatepoint(line, fraction)` (so the point and the distance agree). Distance: `fraction * extensions.st_length(line::extensions.geography) / 1000` km. Add a one-line `shortcut:` comment that locating in degrees is a few metres off at Naga's latitude; fine for fares. Put this in **one helper**, `public.snap_to_route(p_line jsonb, p_lat double precision, p_lng double precision) returns table (lat double precision, lng double precision, km double precision)`, `language sql`, `immutable`, `set search_path = ''`, used by both `nearest_routes` and `board_vehicle`. Returns no row when `p_line` is null. Grant execute to `authenticated` (a security invoker caller needs it), revoke from `public` and `anon` (`supabase/checks/rls.sql` fails on any public function anon can run).

**Fare to the drop point** (LTFRB rates from Sept 28, 2026; Rj's seed uses exactly this formula, see the comments in `supabase/seed/naga.sql`):
- `jeepney`: `14 + 2.00 * greatest(0, km - 4)`
- `modern_jeepney`: `17 + 2.40 * greatest(0, km - 4)`
- `round(..., 2)`, then **capped** at the route's `guide_fare_regular` when that is not null (`least`): a drop at the end of the line never shows more than the full-route guide, and the seed's km were rounded to 0.1, so uncapped it could differ by centavos. `fare_discounted = round(fare_regular * 0.8, 2)`.
- `tricycle`, `bus`, or any route with no line: `fare_regular = guide_fare_regular`, `fare_discounted = guide_fare_discounted`, `drop_km` null. (Tricycles are a flat ₱15 under Naga Ord. 2024-002.)
- Keep the six rate numbers inside the function with a comment `shortcut: LTFRB rates in code, move to a table when they change or coops need to edit them`.

**nearest_routes.** Postgres refuses `create or replace` when the return columns change: `drop function if exists public.nearest_routes(double precision, double precision, double precision, double precision);` first, then create, then restate the revoke from `public, anon` and the grant to `authenticated`. Keep the body of migration 4 (validation, the 300 m skip, the ordering, `limit 10`). The `scored` CTE can call `snap_to_route` with a lateral join; a route with no line falls back to the destination point as it does now (`drop_m` keeps its current meaning).

**board_vehicle.** Drop the 3-argument version first (`drop function if exists public.board_vehicle(text, double precision, double precision);`), or PostgREST cannot choose between the overloads. New rules, in addition to everything migration 7 does (keep every check and message and the error codes LG001 to LG003 as they are):
- The destination is optional, but both halves or neither; each in range; otherwise `raise exception 'invalid destination' using errcode = '22023'` (same wording as `nearest_routes`).
- When given and the vehicle's route (`vehicles.route_id` → `routes.route_line`) has a line, store `drop_lat`, `drop_lng` from `snap_to_route`; otherwise store nulls. The commuter's own position is still never stored.
- Restate revoke/grant for the new signature.

**my_drop_points_today.** Same shape as `my_passengers_today` (security definer, `stable`, `set search_path = ''`, Manila midnight, the driver must still have `role = 'driver'`): returns `lat, lng` of today's boardings on the caller's vehicle where `drop_lat is not null`. **Points only: no ids, no commuter, no time.** Returns no rows for anyone else. Revoke from `public, anon`; grant to `authenticated`.

## Checks to update

Both files end with a tally the team quotes ("N of N PASS"); update the header comment of each to the new total.

`supabase/checks/nearest_routes.sql` (fixtures sit near lat 0, lng 0; 0.01° is about 1.1 km): keep the 12 existing checks and add, with a new fixture route whose line is long enough for the per-km part (for example terminal at lng 0.10, line from 0.10 to 0.20 along the equator, `jeepney`, `guide_fare_regular` set **below** what the formula gives at the end, say 20, so the cap is testable):
- a pin by r1's middle (under 4 km): `fare_regular` is `14.00` and `fare_discounted` is `11.20`; `round(drop_km, 1)` is `1.1`.
- the long line, a pin about 7.8 km along: `(fare_regular = round(14 + 2 * (drop_km - 4), 2))::text` is `true` (compute the expectation in the same query, so spheroid rounding cannot break it), and the drop point lies on the line (`st_dwithin(drop point, line geography, 1)` is `true`).
- the long line, a pin past its end: `fare_regular` equals `guide_fare_regular` (the cap).
- the tricycle route with no line (r2): `fare_regular = guide_fare_regular` is `true` and `drop_km` is null.
- the existing fixtures must not change their current results.

`supabase/checks/rls_behaviour.sql`: route a1 (TEST-001's route) has no line; give it one from terminal f1 to Test Place One, `{"type": "LineString", "coordinates": [[123.18, 13.62], [123.20, 13.64]]}`, so snapping has something to snap to. Then, in the boarding block:
- the "commuter 11 m away boards" call passes a destination on the way, for example `13.635, 123.195`; after it, as the table owner, `select count(*) from public.boardings where drop_lat is not null` is `1`, and the stored point is within 1 m of the line.
- `board_vehicle` with half a destination, and with a destination outside the map, both give `err:22023` (use the commuter and a different vehicle or run them before the successful boarding, since LG003 blocks a repeat).
- the existing 3-argument calls keep working through the defaults (do not rewrite them).
- `my_drop_points_today`: logged out `err:42501`; driver D sees `1` row; commuter A sees `0`; driver E (another coop, no vehicle) sees `0`.
- the "commuter assigned as driver" block at the end: add that they also get `0` drop points.

## Quality bar
- Every new function: `set search_path = ''`, explicit revoke from `public, anon`, explicit grant to `authenticated` (or to nobody, for trigger functions). Security definer only where the function must read what RLS hides (`board_vehicle`, `my_drop_points_today`); `nearest_routes` stays security invoker; the helper is plain.
- Validate every input inside the function; never trust the client's numbers.
- Comment the why in one line, in the style of the existing migrations. Header comment: "Migration 8: ..." with the plain-English reason (the driver's map shows where passengers get off; the fare is to the drop point).
- Smallest SQL that meets the contract. No extra columns, tables or options.

## Report
(append here when done)

- **Wrote** `supabase/migrations/20261027093000_drop_points_and_fares.sql`: `boardings.drop_lat/drop_lng` (nullable, range checks); `snap_to_route` (sql, immutable, plain); `nearest_routes` dropped and recreated with the 5 contract columns appended (validation, 300 m skip, order, `limit 10` and `drop_m` unchanged); `board_vehicle` 3-arg dropped, 5-arg created (all migration 7 checks, messages and LG001 to LG003 kept; destination checked right after the location, `invalid destination` 22023); `my_drop_points_today`. Every function: `set search_path = ''`, revoked from `public, anon`, granted to `authenticated`.
- **Expected tallies:** `nearest_routes.sql` **19 of 19 PASS** (12 old + 7), `rls_behaviour.sql` **75 of 75 PASS** (66 old + 9), `rls.sql` **30 rows OK** (was 28; `snap_to_route` and `my_drop_points_today` added).
- **Changes from the brief, JM please check:** (1) the long-line fixture's guide is **25**, not 20: the formula passes 20 at 7 km, so 20 would cap the 7.8 km pin too; 25 sits between 21.58 (7.8 km) and 28.26 (end). (2) One extra check: a jeepney route **without a line** keeps its guide fares. Reason: `greatest(0, null - 4)` is 0, not null, so without the `sn.km is null` guard a lineless jeepney would get the per-km fare. (3) The commuter-assigned-as-driver block inserts one boarding with a drop point on TEST-002 (as the owner), so its "0 drop points" check proves something.
- `round(drop_km, 1)` in the brief is written `round(drop_km::numeric, 1)` in the checks, because Postgres has no `round(double precision, int)`. The fare does the same cast (`km::numeric`).
- **Not run:** no SQL could run on this laptop. Every call in both check files was reread against the new signatures. The rolled-back pre-push test is the first real run.
- App side: `nearest_routes` rows gain `drop_lat, drop_lng, drop_km, fare_regular, fare_discounted`. Old 3-arg `board_vehicle` calls still work through the defaults.
