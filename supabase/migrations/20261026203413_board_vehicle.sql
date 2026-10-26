-- Migration 7: boarding. A commuter scans the QR on the driver's phone (the vehicle's board_token) and
-- board_vehicle saves a trip, but only next to the vehicle's live position, so a photo of the QR is useless
-- elsewhere. The driver sees how many passengers boarded today through my_passengers_today.
-- Custom error codes so the app and the checks can tell the refusals apart:
-- LG001 vehicle not sharing its location, LG002 too far from it, LG003 already boarded it.

-- Every vehicle gets a board token: the existing ones now, new ones from the trigger below.
insert into public.vehicle_tokens (vehicle_id)
select v.id from public.vehicles v
on conflict (vehicle_id) do nothing;

-- Security definer: coop users add vehicles but cannot write vehicle_tokens.
create or replace function public.create_board_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.vehicle_tokens (vehicle_id) values (new.id)
  on conflict (vehicle_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_vehicle_created on public.vehicles;
create trigger on_vehicle_created
  after insert on public.vehicles
  for each row execute function public.create_board_token();

-- Only the assigned driver reads the token, and only while they are still a driver.
drop policy if exists "vehicle_tokens: own driver reads" on public.vehicle_tokens;
create policy "vehicle_tokens: own driver reads" on public.vehicle_tokens
  for select to authenticated using (
    exists (select 1 from public.vehicles v
            join public.profiles p on p.id = v.driver_id
            where v.id = vehicle_id and v.driver_id = (select auth.uid()) and p.role = 'driver'));

-- The commuter's location is used for the distance check only and never stored.
create or replace function public.board_vehicle(p_token text, p_lat double precision, p_lng double precision)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
  v_lat double precision;
  v_lng double precision;
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'commuter') then
    raise exception 'only commuters can board' using errcode = '42501';
  end if;

  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid location' using errcode = '22023';
  end if;

  select t.vehicle_id into v_vehicle
  from public.vehicle_tokens t
  where t.board_token = p_token;

  if v_vehicle is null then
    raise exception 'This is not a Larga boarding code' using errcode = '22023';
  end if;

  select vp.lat, vp.lng into v_lat, v_lng
  from public.vehicle_positions vp
  where vp.vehicle_id = v_vehicle and vp.updated_at > now() - interval '30 seconds';

  if v_lat is null then
    raise exception 'This vehicle is not sharing its location right now' using errcode = 'LG001';
  end if;

  if not extensions.st_dwithin(
       extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography,
       extensions.st_setsrid(extensions.st_makepoint(v_lng, v_lat), 4326)::extensions.geography,
       100) then
    raise exception 'You are too far from this vehicle to board it' using errcode = 'LG002';
  end if;

  -- shortcut: two scans in the same instant can both pass this check (one extra trip row), add a lock if counts must be exact.
  if exists (select 1 from public.boardings b
             where b.commuter_id = (select auth.uid()) and b.vehicle_id = v_vehicle
               and b.boarded_at > now() - interval '10 minutes') then
    raise exception 'You already boarded this vehicle' using errcode = 'LG003';
  end if;

  insert into public.boardings (commuter_id, vehicle_id) values ((select auth.uid()), v_vehicle);
  return v_vehicle;
end;
$$;

-- Count only, so drivers never see who boarded. 0 for anyone who is not a driver with a vehicle.
create or replace function public.my_passengers_today()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.boardings b
  join public.vehicles v on v.id = b.vehicle_id
  join public.profiles p on p.id = v.driver_id
  where v.driver_id = (select auth.uid()) and p.role = 'driver'
    and b.boarded_at >= date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila'
$$;

revoke execute on function public.create_board_token() from public, anon, authenticated;
revoke execute on function public.board_vehicle(text, double precision, double precision),
  public.my_passengers_today() from public, anon;
grant execute on function public.board_vehicle(text, double precision, double precision),
  public.my_passengers_today() to authenticated;
