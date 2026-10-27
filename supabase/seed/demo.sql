-- Demo board for the pitch: more sample jeeps with a mix of statuses and driver fares, so ride options and
-- the coop Vehicles screen look like a working terminal. Run AFTER naga.sql (Rj's seed, left untouched).
-- Made-up plates (SMP-), sample coop only. Nothing here changes Rj's rows or a real account.
--
-- How to run: paste this whole file in the Supabase SQL Editor. Safe to run again: vehicles have fixed ids
-- and "on conflict do nothing"; the driver steps are plain updates.
-- The 4 demo drivers (demo.driver1..4@example.com) are created by `node scripts/simulate-jeeps.mjs --setup`.
-- Run this file again after that, so they are promoted and put on their jeeps; before that, those steps do nothing.
-- The simulator moves those 4 jeeps and sets their status itself; the other 8 keep the status set here.
--
-- Fares: most driver fares equal the official guide; SMP-1005 and SMP-2004 are above it on purpose, so the app
-- shows "Above the official fare".

-- ---------------------------------------------------------------- 12 sample jeeps (jeepney coop)
insert into public.vehicles (id, coop_id, route_id, plate, vehicle_type, status, driver_fare) values
  -- Centro to Pacol, traditional (guide 24.20)
  ('0de30000-0000-4000-8000-000000001003', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', '12141e5c-7d6f-5351-8229-0ef28ec7e7de', 'SMP-1003', 'jeepney', 'loading', 24.20), -- simulated (demo driver 1)
  ('0de30000-0000-4000-8000-000000001004', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', '12141e5c-7d6f-5351-8229-0ef28ec7e7de', 'SMP-1004', 'jeepney', 'departed', 24.20),
  ('0de30000-0000-4000-8000-000000001005', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', '12141e5c-7d6f-5351-8229-0ef28ec7e7de', 'SMP-1005', 'jeepney', 'loading', 26.00), -- above the guide
  -- Centro to Pacol, modern (guide 29.24)
  ('0de30000-0000-4000-8000-000000001006', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'b2e00d9f-a06b-50ba-bb82-94dcb319d8be', 'SMP-1006', 'modern_jeepney', 'departed', 29.24), -- simulated (demo driver 2)
  ('0de30000-0000-4000-8000-000000001007', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'b2e00d9f-a06b-50ba-bb82-94dcb319d8be', 'SMP-1007', 'modern_jeepney', 'loading', 29.24),
  -- Pacol to Centro, traditional (guide 24.40)
  ('0de30000-0000-4000-8000-000000001008', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'd398138e-a1ed-5e83-8e11-bcb95920a11a', 'SMP-1008', 'jeepney', 'loading', 24.40),
  -- Centro to Carolina, traditional (guide 32.80), passes Pacol
  ('0de30000-0000-4000-8000-000000002003', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'a45fcf13-37f9-5741-861c-a795cc46328f', 'SMP-2003', 'jeepney', 'departed', 32.80), -- simulated (demo driver 3)
  ('0de30000-0000-4000-8000-000000002004', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'a45fcf13-37f9-5741-861c-a795cc46328f', 'SMP-2004', 'jeepney', 'loading', 35.00), -- above the guide
  -- Centro to Carolina, modern (guide 39.56)
  ('0de30000-0000-4000-8000-000000002005', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', '92247da6-0ce3-547f-9c1e-d16dd2e64845', 'SMP-2005', 'modern_jeepney', 'off_duty', null),
  -- Centro to Panicuason, traditional (guide 39.40), passes Pacol
  ('0de30000-0000-4000-8000-000000002006', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'd46aff80-a0cc-5e6c-b318-012ff00912e5', 'SMP-2006', 'jeepney', 'loading', 39.40),
  -- Centro to Panicuason, modern (guide 47.48)
  ('0de30000-0000-4000-8000-000000002007', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', '21db5fd1-3c37-57be-b109-ae7f8c2f6945', 'SMP-2007', 'modern_jeepney', 'departed', 47.48), -- simulated (demo driver 4)
  -- Centro to San Felipe, traditional (guide 16.20)
  ('0de30000-0000-4000-8000-000000003002', 'b6ee27cb-34ef-53a9-90f2-18804abddbe5', 'e0aadbd7-b34d-52e5-af77-d3b5a5c4d1da', 'SMP-3002', 'jeepney', 'loading', 16.20)
on conflict do nothing;

-- ---------------------------------------------------------------- demo drivers (no-ops until --setup made the accounts)
update public.profiles p
set role = 'driver', coop_id = 'b6ee27cb-34ef-53a9-90f2-18804abddbe5'
from auth.users u
where u.id = p.id and u.email in ('demo.driver1@example.com', 'demo.driver2@example.com',
                                  'demo.driver3@example.com', 'demo.driver4@example.com');

update public.vehicles v
set driver_id = u.id
from auth.users u
where (v.plate, u.email) in (('SMP-1003', 'demo.driver1@example.com'), ('SMP-1006', 'demo.driver2@example.com'),
                             ('SMP-2003', 'demo.driver3@example.com'), ('SMP-2007', 'demo.driver4@example.com'))
  and v.driver_id is distinct from u.id;

-- Check: 12 rows; the 4 simulated jeeps show their demo driver once --setup has run.
select v.plate, v.status, v.driver_fare, r.guide_fare_regular as guide, u.email as driver
from public.vehicles v
join public.routes r on r.id = v.route_id
left join auth.users u on u.id = v.driver_id
where v.id::text like '0de30000-%'
order by v.plate;

-- ---------------------------------------------------------------- RESET before each demo run (paste on its own)
-- Removes the demo commuter's rides from today, so Scan to board works again ("You already boarded this
-- vehicle" lasts 10 min) and the driver's passenger count, drop-off pins and alerts start fresh.
-- Keeps the seeded history rides from demo-trips.sql (their ids start with 0de30000-).
-- delete from public.boardings
-- where commuter_id = (select id from auth.users where email = 'markphilips@example.com')
--   and boarded_at > now() - interval '1 day'
--   and id::text not like '0de30000-%';

-- ---------------------------------------------------------------- UNDO (removes only the demo rows)
-- delete from public.vehicles where id::text like '0de30000-%';  -- tokens and positions go with them; trips keep an empty vehicle
-- update public.profiles set role = 'commuter', coop_id = null
-- where id in (select id from auth.users where email like 'demo.driver_@example.com');
