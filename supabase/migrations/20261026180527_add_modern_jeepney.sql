-- Migration 3: modern jeepney vehicle type, and coops can only assign their own coop's drivers.
-- Idempotent on purpose: safe to re-run if a push fails halfway.
-- Traditional and modern jeeps have different LTFRB fares, so a route served by both gets one row per type.
-- 'jeepney' keeps meaning the traditional jeep; existing rows are not changed.

-- ---------------------------------------------------------------- vehicle types
-- Migration 1 wrote these checks inline, so Postgres named them <table>_<column>_check.

alter table public.routes drop constraint if exists routes_vehicle_type_check;
alter table public.routes add constraint routes_vehicle_type_check
  check (vehicle_type in ('jeepney', 'modern_jeepney', 'tricycle', 'bus'));

alter table public.vehicles drop constraint if exists vehicles_vehicle_type_check;
alter table public.vehicles add constraint vehicles_vehicle_type_check
  check (vehicle_type in ('jeepney', 'modern_jeepney', 'tricycle', 'bus'));

-- ---------------------------------------------------------------- vehicles RLS
-- Migration 1 checked the coop and the route but not driver_id, so a coop user could assign any account as a
-- driver. Both policies are as in migration 1, plus: driver_id is null or a driver of the caller's own coop.

drop policy if exists "vehicles: coop inserts own" on public.vehicles;
create policy "vehicles: coop inserts own" on public.vehicles
  for insert to authenticated with check (
    coop_id = (select public.my_coop_id())
    and (route_id is null or exists (
      select 1 from public.routes r join public.terminals t on t.id = r.terminal_id
      where r.id = route_id and t.coop_id = (select public.my_coop_id())))
    and (driver_id is null or exists (
      select 1 from public.profiles p
      where p.id = driver_id and p.role = 'driver' and p.coop_id = (select public.my_coop_id()))));

drop policy if exists "vehicles: coop updates own" on public.vehicles;
create policy "vehicles: coop updates own" on public.vehicles
  for update to authenticated
  using (coop_id = (select public.my_coop_id()))
  with check (
    coop_id = (select public.my_coop_id())
    and (route_id is null or exists (
      select 1 from public.routes r join public.terminals t on t.id = r.terminal_id
      where r.id = route_id and t.coop_id = (select public.my_coop_id())))
    and (driver_id is null or exists (
      select 1 from public.profiles p
      where p.id = driver_id and p.role = 'driver' and p.coop_id = (select public.my_coop_id()))));
