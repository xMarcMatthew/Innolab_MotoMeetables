-- Migration 8: drop points and the fare to the drop point.
-- The commuter's destination is snapped to the route line: nearest_routes shows the fare from the terminal to
-- that point (not the full-route fare), and board_vehicle stores it on the boarding, so the driver's map shows
-- where passengers get off through my_drop_points_today (points only, never who).

-- Always a point on the vehicle's route line, never the commuter's own position.
alter table public.boardings
  add column if not exists drop_lat double precision check (drop_lat between -90 and 90),
  add column if not exists drop_lng double precision check (drop_lng between -180 and 180);

-- The point on a route line nearest a pin, and how far along the line it is. No row when there is no line.
-- shortcut: locates the point in degrees, a few metres off at Naga's latitude; fine for fares, locate on
-- geography if drop points must be exact.
create or replace function public.snap_to_route(p_line jsonb, p_lat double precision, p_lng double precision)
returns table (lat double precision, lng double precision, km double precision)
language sql
immutable
set search_path = ''
as $$
  select extensions.st_y(d.pt), extensions.st_x(d.pt),
         f.frac * extensions.st_length(l.line::extensions.geography) / 1000
  from (select extensions.st_setsrid(extensions.st_geomfromgeojson(p_line::text), 4326) as line) l
  cross join lateral (select extensions.st_linelocatepoint(l.line,
                        extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)) as frac) f
  -- Interpolated from the same fraction, so the point and the distance agree.
  cross join lateral (select extensions.st_lineinterpolatepoint(l.line, f.frac) as pt) d
  where p_line is not null
$$;

-- Postgres refuses create or replace when the returned columns change, so drop it first.
drop function if exists public.nearest_routes(double precision, double precision, double precision, double precision);

-- shortcut: parses every route line on each search; fine for dozens of routes, cache the parsed lines if
-- routes reach the thousands.
create or replace function public.nearest_routes(
  p_dest_lat double precision,
  p_dest_lng double precision,
  p_my_lat double precision default null,
  p_my_lng double precision default null
)
returns table (
  route_id uuid,
  destination_name text,
  vehicle_type text,
  terminal_id uuid,
  terminal_name text,
  terminal_lat double precision,
  terminal_lng double precision,
  guide_fare_regular numeric,
  guide_fare_discounted numeric,
  drop_m double precision, -- pin to the nearest point of the route line (or its destination)
  terminal_m double precision, -- commuter to the terminal; null without the commuter's location
  drop_lat double precision, -- the point on the route line nearest the pin (or its destination)
  drop_lng double precision,
  drop_km double precision, -- along the line from its start (the terminal) to the drop point; null without a line
  fare_regular numeric, -- fare to the drop point; the guide fare when it cannot be computed
  fare_discounted numeric
)
language plpgsql
stable
security invoker -- reads under the caller's own RLS; nothing here needs more rights
set search_path = ''
as $$
begin
  if p_dest_lat is null or p_dest_lng is null
     or p_dest_lat not between -90 and 90 or p_dest_lng not between -180 and 180 then
    raise exception 'invalid destination' using errcode = '22023';
  end if;
  -- The commuter's location is optional, but both halves or neither. Used for sorting, never stored.
  if (p_my_lat is null) <> (p_my_lng is null)
     or p_my_lat not between -90 and 90 or p_my_lng not between -180 and 180 then
    raise exception 'invalid location' using errcode = '22023';
  end if;

  return query
  with pts as (
    select
      extensions.st_setsrid(extensions.st_makepoint(p_dest_lng, p_dest_lat), 4326)::extensions.geography as pin,
      extensions.st_setsrid(extensions.st_makepoint(p_my_lng, p_my_lat), 4326)::extensions.geography as me
  ),
  scored as (
    select
      r.id, r.destination_name, r.vehicle_type, r.terminal_id,
      t.name as t_name, t.lat as t_lat, t.lng as t_lng,
      r.guide_fare_regular, r.guide_fare_discounted,
      extensions.st_distance(pts.pin, coalesce(
        extensions.st_setsrid(extensions.st_geomfromgeojson(r.route_line::text), 4326),
        extensions.st_setsrid(extensions.st_makepoint(r.destination_lng, r.destination_lat), 4326)
      )::extensions.geography) as d_drop,
      extensions.st_distance(pts.me,
        extensions.st_setsrid(extensions.st_makepoint(t.lng, t.lat), 4326)::extensions.geography) as d_term,
      extensions.st_distance(pts.pin,
        extensions.st_setsrid(extensions.st_makepoint(t.lng, t.lat), 4326)::extensions.geography) as d_pin_term,
      coalesce(sn.lat, r.destination_lat) as d_lat,
      coalesce(sn.lng, r.destination_lng) as d_lng,
      sn.km,
      -- LTFRB per-km fare (Rj's seed uses the same formula), jeepneys with a line only; null keeps the guide.
      -- The null check comes first because greatest() ignores nulls.
      -- shortcut: LTFRB rates in code, move to a table when they change or coops need to edit them.
      round(case
              when sn.km is null then null
              when r.vehicle_type = 'jeepney' then 14 + 2.00 * greatest(0, sn.km::numeric - 4)
              when r.vehicle_type = 'modern_jeepney' then 17 + 2.40 * greatest(0, sn.km::numeric - 4)
            end, 2) as km_fare
    from public.routes r
    join public.terminals t on t.id = r.terminal_id
    cross join pts
    left join lateral public.snap_to_route(r.route_line, p_dest_lat, p_dest_lng) sn on true
  )
  select s.id, s.destination_name, s.vehicle_type, s.terminal_id, s.t_name, s.t_lat, s.t_lng,
         s.guide_fare_regular, s.guide_fare_discounted, s.d_drop, s.d_term,
         s.d_lat, s.d_lng, s.km,
         -- Capped at the full-route guide: the seed's km were rounded to 0.1, and no drop costs more than the whole ride.
         case when s.km_fare is null then s.guide_fare_regular
              else least(s.km_fare, s.guide_fare_regular) end,
         case when s.km_fare is null then s.guide_fare_discounted
              else round(least(s.km_fare, s.guide_fare_regular) * 0.8, 2) end
  from scored s
  -- A route leaving from within 300 m of the pin cannot take you there (and 300 m is walking distance).
  where s.d_pin_term > 300
  -- Drops within the same 100 m count as a tie; then the terminal nearest the commuter comes first.
  order by floor(s.d_drop / 100), s.d_term nulls last, s.d_drop
  limit 10;
end;
$$;

-- Two overloads would leave PostgREST unable to choose, so the 3-argument version goes. Old 3-argument
-- calls still work through the defaults.
drop function if exists public.board_vehicle(text, double precision, double precision);

-- The commuter's location is used for the distance check only and never stored.
create or replace function public.board_vehicle(
  p_token text,
  p_lat double precision,
  p_lng double precision,
  p_dest_lat double precision default null,
  p_dest_lng double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle uuid;
  v_lat double precision;
  v_lng double precision;
  v_drop_lat double precision;
  v_drop_lng double precision;
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'commuter') then
    raise exception 'only commuters can board' using errcode = '42501';
  end if;

  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid location' using errcode = '22023';
  end if;

  -- The destination is optional, but both halves or neither.
  if (p_dest_lat is null) <> (p_dest_lng is null)
     or p_dest_lat not between -90 and 90 or p_dest_lng not between -180 and 180 then
    raise exception 'invalid destination' using errcode = '22023';
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

  -- No row (no destination, no route, or a route without a line) leaves the drop point empty.
  select s.lat, s.lng into v_drop_lat, v_drop_lng
  from public.vehicles v
  join public.routes r on r.id = v.route_id
  cross join lateral public.snap_to_route(r.route_line, p_dest_lat, p_dest_lng) s
  where v.id = v_vehicle and p_dest_lat is not null;

  insert into public.boardings (commuter_id, vehicle_id, drop_lat, drop_lng)
  values ((select auth.uid()), v_vehicle, v_drop_lat, v_drop_lng);
  return v_vehicle;
end;
$$;

-- Points only (no ids, no commuter, no time), so drivers still never see who boarded. No rows for anyone
-- who is not a driver with a vehicle.
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
$$;

-- nearest_routes is security invoker, so its callers need snap_to_route too.
revoke execute on function public.snap_to_route(jsonb, double precision, double precision),
  public.nearest_routes(double precision, double precision, double precision, double precision),
  public.board_vehicle(text, double precision, double precision, double precision, double precision),
  public.my_drop_points_today() from public, anon;
grant execute on function public.snap_to_route(jsonb, double precision, double precision),
  public.nearest_routes(double precision, double precision, double precision, double precision),
  public.board_vehicle(text, double precision, double precision, double precision, double precision),
  public.my_drop_points_today() to authenticated;
