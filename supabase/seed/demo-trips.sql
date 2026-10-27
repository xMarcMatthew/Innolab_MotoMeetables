-- Demo rides for the commuter Trips tab: five boardings for markphilips@example.com over the last week, on
-- demo-board jeeps (supabase/seed/demo.sql), so the tab shows "Today", "Yesterday" and dated groups.
-- Run AFTER demo.sql. Paste the whole file in the Supabase SQL Editor. Safe to run again: fixed ids and
-- "on conflict do nothing". Times are relative to now, so the groups stay fresh whenever it is run.
--
-- The rows are already cleared (cleared_at set) and carry no drop point, so the driver's Map tab and the
-- drop-off alerts (migration 9) ignore them. Only the commuter's own Trips tab reads them.

insert into public.boardings (id, commuter_id, vehicle_id, boarded_at, cleared_at)
select v.id_fixed, u.id, veh.id, v.boarded, v.boarded + interval '40 minutes'
from (values
  ('0de30000-0000-4000-8000-0000000b0001'::uuid, 'SMP-1003', now() - interval '2 hours'),            -- today, Centro to Pacol
  ('0de30000-0000-4000-8000-0000000b0002'::uuid, 'SMP-1008', now() - interval '1 day 3 hours'),     -- yesterday, Pacol to Centro
  ('0de30000-0000-4000-8000-0000000b0003'::uuid, 'SMP-1006', now() - interval '1 day 11 hours'),    -- yesterday, modern jeep
  ('0de30000-0000-4000-8000-0000000b0004'::uuid, 'SMP-2003', now() - interval '3 days 5 hours'),    -- Centro to Carolina
  ('0de30000-0000-4000-8000-0000000b0005'::uuid, 'SMP-3002', now() - interval '6 days 2 hours')     -- Centro to San Felipe
) as v (id_fixed, plate, boarded)
join auth.users u on u.email = 'markphilips@example.com'
join public.vehicles veh on veh.plate = v.plate
on conflict (id) do nothing;

-- Check: 5 rows, newest first.
select b.boarded_at, veh.plate, r.destination_name
from public.boardings b
join public.vehicles veh on veh.id = b.vehicle_id
join public.routes r on r.id = veh.route_id
where b.id::text like '0de30000-0000-4000-8000-0000000b%'
order by b.boarded_at desc;

-- ---------------------------------------------------------------- UNDO (removes only these demo rides)
-- delete from public.boardings where id::text like '0de30000-0000-4000-8000-0000000b%';
