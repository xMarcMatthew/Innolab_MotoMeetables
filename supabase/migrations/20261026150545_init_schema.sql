-- Migration 1: Larga schema, RLS and the driver's must-have RPCs.
-- Idempotent on purpose: safe to re-run if a push fails halfway.
-- After-H10 pieces (update_my_location, board_vehicle, push_tokens) come in their own migration.

-- PostGIS is for distance math inside functions only. Tables store plain lat/lng numbers because the API
-- and Realtime return geography columns as hex, which the app cannot plot.
create extension if not exists postgis with schema extensions;

-- New objects in public are not exposed to the app unless a migration grants them.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------- tables

create table if not exists public.coops (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  type text not null check (type in ('jeepney_coop', 'toda', 'bus_operator')),
  created_at timestamptz not null default now()
);

-- role is only ever set by us (SQL editor); the app can never change it.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'commuter' check (role in ('commuter', 'driver', 'coop')),
  full_name text check (char_length(full_name) <= 120),
  coop_id uuid references public.coops (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.terminals (
  id uuid primary key default gen_random_uuid(),
  coop_id uuid not null references public.coops (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_at timestamptz not null default now()
);

-- One row per terminal and destination: the coop's official fare guide.
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  terminal_id uuid not null references public.terminals (id) on delete cascade,
  destination_name text not null check (char_length(destination_name) between 1 and 120),
  destination_lat double precision not null check (destination_lat between -90 and 90),
  destination_lng double precision not null check (destination_lng between -180 and 180),
  vehicle_type text not null check (vehicle_type in ('jeepney', 'tricycle', 'bus')),
  route_line jsonb, -- GeoJSON LineString
  guide_fare_regular numeric(8, 2) not null check (guide_fare_regular >= 0),
  guide_fare_discounted numeric(8, 2) check (guide_fare_discounted >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  coop_id uuid not null references public.coops (id) on delete cascade,
  route_id uuid references public.routes (id) on delete set null,
  plate text not null unique check (char_length(plate) between 1 and 20),
  vehicle_type text not null check (vehicle_type in ('jeepney', 'tricycle', 'bus')),
  driver_id uuid unique references public.profiles (id) on delete set null,
  status text not null default 'off_duty' check (status in ('off_duty', 'loading', 'departed')),
  driver_fare numeric(8, 2) check (driver_fare >= 0),
  payment_qr text check (char_length(payment_qr) <= 1000), -- QR Ph payload text, never an image
  created_at timestamptz not null default now()
);

-- Separate table because RLS hides rows, not columns.
create table if not exists public.vehicle_tokens (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  board_token text not null unique default gen_random_uuid()::text
);

create table if not exists public.vehicle_positions (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  updated_at timestamptz not null default now()
);

create table if not exists public.boardings (
  id uuid primary key default gen_random_uuid(),
  commuter_id uuid not null references public.profiles (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null, -- trip history survives a deleted vehicle
  boarded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers

-- The caller's coop, only when they are a coop user. Used by the coop write policies.
create or replace function public.my_coop_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.coop_id from public.profiles p
  where p.id = (select auth.uid()) and p.role = 'coop'
$$;

-- Every sign-up becomes a commuter; role is never read from sign-up data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(new.raw_user_meta_data ->> 'full_name', 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- driver RPCs (must-have)

create or replace function public.set_vehicle_status(p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status is null or p_status not in ('off_duty', 'loading', 'departed') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  update public.vehicles v
  set status = p_status
  where v.driver_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = v.driver_id and p.role = 'driver');

  if not found then
    raise exception 'no vehicle assigned to this driver' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.set_my_fare(p_fare numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_fare is null or p_fare < 0 or p_fare > 10000 then
    raise exception 'invalid fare' using errcode = '22023';
  end if;

  update public.vehicles v
  set driver_fare = round(p_fare, 2)
  where v.driver_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = v.driver_id and p.role = 'driver');

  if not found then
    raise exception 'no vehicle assigned to this driver' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------- grants (explicit, nothing for anon)

revoke all on public.coops, public.profiles, public.terminals, public.routes, public.vehicles,
  public.vehicle_tokens, public.vehicle_positions, public.boardings from anon, authenticated;

grant select on public.coops, public.profiles, public.vehicle_tokens, public.vehicle_positions,
  public.boardings to authenticated;
grant select, insert, update, delete on public.terminals, public.routes, public.vehicles to authenticated;
grant update (full_name) on public.profiles to authenticated; -- column grant: role and coop_id stay locked

revoke execute on function public.my_coop_id(), public.handle_new_user(),
  public.set_vehicle_status(text), public.set_my_fare(numeric) from public, anon;
revoke execute on function public.handle_new_user() from authenticated;
grant execute on function public.my_coop_id(), public.set_vehicle_status(text),
  public.set_my_fare(numeric) to authenticated;

-- ---------------------------------------------------------------- RLS

alter table public.coops enable row level security;
alter table public.profiles enable row level security;
alter table public.terminals enable row level security;
alter table public.routes enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_tokens enable row level security;
alter table public.vehicle_positions enable row level security;
alter table public.boardings enable row level security;

-- coops: read only from the app; we create coops ourselves.
drop policy if exists "coops: logged-in users read" on public.coops;
create policy "coops: logged-in users read" on public.coops
  for select to authenticated using (true);

-- profiles: read and rename your own row only.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- A coop user sees its own coop's drivers, to assign them to vehicles. Set coop_id when promoting a driver.
drop policy if exists "profiles: coop reads own drivers" on public.profiles;
create policy "profiles: coop reads own drivers" on public.profiles
  for select to authenticated
  using (role = 'driver' and coop_id = (select public.my_coop_id()));

drop policy if exists "profiles: update own name" on public.profiles;
create policy "profiles: update own name" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- terminals: everyone logged in reads; a coop user writes their own coop's.
drop policy if exists "terminals: logged-in users read" on public.terminals;
create policy "terminals: logged-in users read" on public.terminals
  for select to authenticated using (true);

drop policy if exists "terminals: coop inserts own" on public.terminals;
create policy "terminals: coop inserts own" on public.terminals
  for insert to authenticated with check (coop_id = (select public.my_coop_id()));

drop policy if exists "terminals: coop updates own" on public.terminals;
create policy "terminals: coop updates own" on public.terminals
  for update to authenticated
  using (coop_id = (select public.my_coop_id()))
  with check (coop_id = (select public.my_coop_id()));

drop policy if exists "terminals: coop deletes own" on public.terminals;
create policy "terminals: coop deletes own" on public.terminals
  for delete to authenticated using (coop_id = (select public.my_coop_id()));

-- routes: same rule, through the route's terminal.
drop policy if exists "routes: logged-in users read" on public.routes;
create policy "routes: logged-in users read" on public.routes
  for select to authenticated using (true);

drop policy if exists "routes: coop inserts own" on public.routes;
create policy "routes: coop inserts own" on public.routes
  for insert to authenticated with check (
    exists (select 1 from public.terminals t
            where t.id = terminal_id and t.coop_id = (select public.my_coop_id())));

drop policy if exists "routes: coop updates own" on public.routes;
create policy "routes: coop updates own" on public.routes
  for update to authenticated
  using (exists (select 1 from public.terminals t
                 where t.id = terminal_id and t.coop_id = (select public.my_coop_id())))
  with check (exists (select 1 from public.terminals t
                      where t.id = terminal_id and t.coop_id = (select public.my_coop_id())));

drop policy if exists "routes: coop deletes own" on public.routes;
create policy "routes: coop deletes own" on public.routes
  for delete to authenticated using (
    exists (select 1 from public.terminals t
            where t.id = terminal_id and t.coop_id = (select public.my_coop_id())));

-- vehicles: everyone logged in reads; a coop user writes their own coop's, on their own routes.
-- Drivers change status and fare only through set_vehicle_status and set_my_fare.
drop policy if exists "vehicles: logged-in users read" on public.vehicles;
create policy "vehicles: logged-in users read" on public.vehicles
  for select to authenticated using (true);

drop policy if exists "vehicles: coop inserts own" on public.vehicles;
create policy "vehicles: coop inserts own" on public.vehicles
  for insert to authenticated with check (
    coop_id = (select public.my_coop_id())
    and (route_id is null or exists (
      select 1 from public.routes r join public.terminals t on t.id = r.terminal_id
      where r.id = route_id and t.coop_id = (select public.my_coop_id()))));

drop policy if exists "vehicles: coop updates own" on public.vehicles;
create policy "vehicles: coop updates own" on public.vehicles
  for update to authenticated
  using (coop_id = (select public.my_coop_id()))
  with check (
    coop_id = (select public.my_coop_id())
    and (route_id is null or exists (
      select 1 from public.routes r join public.terminals t on t.id = r.terminal_id
      where r.id = route_id and t.coop_id = (select public.my_coop_id()))));

drop policy if exists "vehicles: coop deletes own" on public.vehicles;
create policy "vehicles: coop deletes own" on public.vehicles
  for delete to authenticated using (coop_id = (select public.my_coop_id()));

-- vehicle_tokens: only the vehicle's own driver reads its boarding token. No writes from the app.
drop policy if exists "vehicle_tokens: own driver reads" on public.vehicle_tokens;
create policy "vehicle_tokens: own driver reads" on public.vehicle_tokens
  for select to authenticated using (
    exists (select 1 from public.vehicles v
            where v.id = vehicle_id and v.driver_id = (select auth.uid())));

-- vehicle_positions: everyone logged in reads; writes come later through update_my_location.
drop policy if exists "vehicle_positions: logged-in users read" on public.vehicle_positions;
create policy "vehicle_positions: logged-in users read" on public.vehicle_positions
  for select to authenticated using (true);

-- boardings: a commuter reads only their own trips; inserts come later through board_vehicle.
drop policy if exists "boardings: commuter reads own" on public.boardings;
create policy "boardings: commuter reads own" on public.boardings
  for select to authenticated using (commuter_id = (select auth.uid()));

-- ---------------------------------------------------------------- realtime (live status and markers)

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vehicles') then
    alter publication supabase_realtime add table public.vehicles;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vehicle_positions') then
    alter publication supabase_realtime add table public.vehicle_positions;
  end if;
end;
$$;
