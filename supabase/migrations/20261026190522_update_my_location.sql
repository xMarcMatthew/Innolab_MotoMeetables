-- Migration 5: update_my_location, called by the driver's background GPS task about every 5 s.
-- The vehicle comes from auth.uid(), never from the app, so a driver can only move their own vehicle.
-- Commuters read vehicle_positions (already in the Realtime publication since migration 1) and hide a
-- vehicle after 15 s without an update.

create or replace function public.update_my_location(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
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
end;
$$;

revoke execute on function public.update_my_location(double precision, double precision) from public, anon;
grant execute on function public.update_my_location(double precision, double precision) to authenticated;
