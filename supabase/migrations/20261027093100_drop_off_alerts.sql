-- Migration 9: drop-off alerts. About 200 m before a passenger's drop point, the driver's phone plays a sound
-- and shows "Drop-off ahead" (a local notification from the GPS task, no push server). Each drop point alerts
-- once. End trip (status off_duty) clears the trip's pins, so the next trip starts with an empty map.

alter table public.boardings
  add column if not exists alerted_at timestamptz, -- the driver was warned about this drop point
  add column if not exists cleared_at timestamptz; -- the trip ended; the pin no longer shows

-- Now returns how many drop points just came within 200 m (0 most of the time), so the GPS task can alert.
-- Postgres refuses create or replace when the return type changes, so drop it first.
drop function if exists public.update_my_location(double precision, double precision);

create or replace function public.update_my_location(p_lat double precision, p_lng double precision)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
  v_alerts integer;
begin
  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid location' using errcode = '22023';
  end if;

  select v.id into v_vehicle
  from public.vehicles v
  join public.profiles p on p.id = v.driver_id
  where v.driver_id = (select auth.uid()) and p.role = 'driver';

  if v_vehicle is null then
    raise exception 'no vehicle assigned to this driver' using errcode = '42501';
  end if;

  insert into public.vehicle_positions (vehicle_id, lat, lng, updated_at)
  values (v_vehicle, p_lat, p_lng, now())
  on conflict (vehicle_id) do update
    set lat = excluded.lat, lng = excluded.lng, updated_at = excluded.updated_at;

  -- Marked in the same statement that finds them, so each drop point alerts exactly once.
  with alerted as (
    update public.boardings b
    set alerted_at = now()
    where b.vehicle_id = v_vehicle
      and b.drop_lat is not null and b.alerted_at is null and b.cleared_at is null
      and b.boarded_at >= date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
      and extensions.st_dwithin(
            extensions.st_setsrid(extensions.st_makepoint(b.drop_lng, b.drop_lat), 4326)::extensions.geography,
            extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
            200)
    returning 1
  )
  select count(*) into v_alerts from alerted;

  return v_alerts;
end;
$$;

-- Same as migration 1, plus: going off duty (End trip) clears the vehicle's pins.
create or replace function public.set_vehicle_status(p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
begin
  if p_status is null or p_status not in ('off_duty', 'loading', 'departed') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  update public.vehicles v
  set status = p_status
  where v.driver_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = v.driver_id and p.role = 'driver')
  returning v.id into v_vehicle;

  if v_vehicle is null then
    raise exception 'no vehicle assigned to this driver' using errcode = '42501';
  end if;

  if p_status = 'off_duty' then
    update public.boardings b
    set cleared_at = now()
    where b.vehicle_id = v_vehicle and b.cleared_at is null;
  end if;
end;
$$;

-- Same as migration 8, minus the pins of trips that already ended.
create or replace function public.my_drop_points_today()
returns table (lat double precision, lng double precision)
language sql
stable
security definer
set search_path = ''
as $$
  select b.drop_lat, b.drop_lng
  from public.boardings b
  join public.vehicles v on v.id = b.vehicle_id
  join public.profiles p on p.id = v.driver_id
  where v.driver_id = (select auth.uid()) and p.role = 'driver'
    and b.boarded_at >= date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
    and b.drop_lat is not null
    and b.cleared_at is null
$$;

-- The drop above removed update_my_location's grants; set_vehicle_status and my_drop_points_today keep theirs.
revoke execute on function public.update_my_location(double precision, double precision) from public, anon;
grant execute on function public.update_my_location(double precision, double precision) to authenticated;
