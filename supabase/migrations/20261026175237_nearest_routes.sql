-- Migration 2: nearest_routes, the core-flow search. The commuter drops a pin; this returns the routes
-- that pass closest to it, measured to the route line, since a jeepney passes places on the way.
-- Agreed with Matt Oct 27: no distance cutoff, one row per route, no route lines or vehicles in the
-- result (the app reads those separately).

-- One malformed route_line would make every search fail, so only GeoJSON LineStrings get in.
-- At least 2 points: an empty line gives no distance and would hide its route from every search.
alter table public.routes drop constraint if exists routes_route_line_is_linestring;
alter table public.routes add constraint routes_route_line_is_linestring check (
  route_line is null
  or (extensions.st_geometrytype(extensions.st_geomfromgeojson(route_line::text)) = 'ST_LineString'
      and extensions.st_npoints(extensions.st_geomfromgeojson(route_line::text)) >= 2)
);

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
  terminal_m double precision -- commuter to the terminal; null without the commuter's location
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
        extensions.st_setsrid(extensions.st_makepoint(t.lng, t.lat), 4326)::extensions.geography) as d_term
    from public.routes r
    join public.terminals t on t.id = r.terminal_id
    cross join pts
  )
  select s.id, s.destination_name, s.vehicle_type, s.terminal_id, s.t_name, s.t_lat, s.t_lng,
         s.guide_fare_regular, s.guide_fare_discounted, s.d_drop, s.d_term
  from scored s
  -- Drops within the same 100 m count as a tie; then the terminal nearest the commuter comes first.
  order by floor(s.d_drop / 100), s.d_term nulls last, s.d_drop
  limit 10;
end;
$$;

revoke execute on function public.nearest_routes(double precision, double precision, double precision, double precision)
  from public, anon;
grant execute on function public.nearest_routes(double precision, double precision, double precision, double precision)
  to authenticated;
