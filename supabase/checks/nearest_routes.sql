-- nearest_routes check: calls the search as a logged-in user and expects each answer.
-- Runs inside a transaction that is ALWAYS rolled back, so it leaves no data behind.
-- Paste into the SQL Editor (or: npx supabase db query --linked -f supabase/checks/nearest_routes.sql).
-- It ends with an error on purpose; the message should read "19 of 19 PASS" and "no failures".
-- Test routes sit near lat 0, lng 0 (open sea), so real Naga routes never outrank them.

begin;

create temp table results (n serial, check_name text, expected text, got text);

-- Returns the single value a query produces as a user (null = logged out), or 'err:SQLSTATE'.
create function pg_temp.try_val(p_uid uuid, p_sql text) returns text language plpgsql as $$
declare v text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  if p_uid is null then set local role anon; else set local role authenticated; end if;
  begin
    execute p_sql into v;
  exception when others then
    v := 'err:' || sqlstate;
  end;
  reset role;
  return v;
end $$;

-- Runs a statement as the table owner and reports 'ok' or 'err:SQLSTATE'.
create function pg_temp.try_owner(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return 'err:' || sqlstate;
end $$;

create function pg_temp.expect(p_check text, p_expected text, p_got text) returns void language sql as $$
  insert into results (check_name, expected, got) values (p_check, p_expected, p_got);
$$;

-- Fixtures. 0.01 degrees is about 1.1 km at the equator.
-- r1: a line along the equator from lng 0 to 0.02, ending far from the pins below.
-- r2: no line, destination at lng 0.03.
-- r3 and r4: no line, destinations 22 m apart at lng 0.05; r3 from terminal f1 (lng 0.06), r4 from f2 (lng 0.04).
-- r5: an 11.1 km line along the equator from terminal f3 (lng 0.10) to lng 0.20. Its guide fare, 25, sits between
-- the per-km fare at 7.8 km (21.58) and at the end (28.26), so the cap shows only past the end.
insert into public.coops (id, name, type) values
  ('00000000-0000-0000-0000-0000000000c1', 'Test Coop One', 'jeepney_coop');

insert into public.terminals (id, coop_id, name, lat, lng) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1', 'Test Terminal East', 0, 0.06),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000c1', 'Test Terminal West', 0, 0.04),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000c1', 'Test Terminal Far', 0, 0.10);

insert into public.routes (id, terminal_id, destination_name, destination_lat, destination_lng, vehicle_type,
                           guide_fare_regular, route_line) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Line End', 0, 0.02, 'jeepney', 14,
   '{"type": "LineString", "coordinates": [[0, 0], [0.02, 0]]}'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f1', 'Point Place', 0, 0.03, 'tricycle', 15, null),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000f1', 'Shared Place', 0, 0.05, 'jeepney', 14, null),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000f2', 'Shared Place', 0, 0.0502, 'jeepney', 14, null),
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000f3', 'Long Line End', 0, 0.20, 'jeepney', 25,
   '{"type": "LineString", "coordinates": [[0.10, 0], [0.20, 0]]}');

-- User ...0a below is any signed-in user; the search needs no profile.
select pg_temp.expect('logged out cannot search', 'err:42501',
  pg_temp.try_val(null, 'select count(*) from public.nearest_routes(0, 0.01)'));

-- Pin 11 m north of the middle of r1's line, 1.1 km from r1's destination.
select pg_temp.expect('a pin along a route line matches that route first', '00000000-0000-0000-0000-0000000000a1',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select route_id::text from public.nearest_routes(0.0001, 0.01) limit 1'));
select pg_temp.expect('drop distance is measured to the line, not the destination', '11',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select round(drop_m)::text from public.nearest_routes(0.0001, 0.01) limit 1'));
select pg_temp.expect('a route without a line matches by its destination', '00000000-0000-0000-0000-0000000000a2',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select route_id::text from public.nearest_routes(0, 0.03) limit 1'));

-- Pin on Shared Place: r3 drops you 0 m, r4 22 m, so they tie within 100 m.
select pg_temp.expect('without my location, the closer drop comes first', '00000000-0000-0000-0000-0000000000a3',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select route_id::text from public.nearest_routes(0, 0.05) limit 1'));
select pg_temp.expect('with my location, the terminal nearest me wins a tie', '00000000-0000-0000-0000-0000000000a4',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select route_id::text from public.nearest_routes(0, 0.05, 0, 0.039) limit 1'));

-- Pin on terminal f2: r4 leaves from there, so it cannot take you there.
select pg_temp.expect('a route that starts at the pin is skipped', '0',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select count(*) from public.nearest_routes(0, 0.04) where route_id = '00000000-0000-0000-0000-0000000000a4'$q$));

-- Fare to the drop point (migration 8). The pin by r1's middle is 1.1 km along its line: under 4 km is the base fare.
select pg_temp.expect('a drop under 4 km pays the base fare', '14.00 11.20',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select fare_regular || ' ' || fare_discounted from public.nearest_routes(0.0001, 0.01) where route_id = '00000000-0000-0000-0000-0000000000a1'$q$));
select pg_temp.expect('drop_km is measured along the line', '1.1',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select round(drop_km::numeric, 1)::text from public.nearest_routes(0.0001, 0.01) where route_id = '00000000-0000-0000-0000-0000000000a1'$q$));
-- Pin 11 m north of r5's line, about 7.8 km along. The expectation is computed in the same query, so spheroid
-- rounding cannot break it; a capped or missing fare would not match.
select pg_temp.expect('past 4 km the fare adds the per-km rate', 'true',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select (fare_regular = round(14 + 2 * (drop_km::numeric - 4), 2))::text from public.nearest_routes(0.0001, 0.17) where route_id = '00000000-0000-0000-0000-0000000000a5'$q$));
select pg_temp.expect('the drop point lies on the route line, not at the pin', 'true',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select extensions.st_dwithin(
      extensions.st_setsrid(extensions.st_makepoint(n.drop_lng, n.drop_lat), 4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_geomfromgeojson(r.route_line::text), 4326)::extensions.geography, 1)::text
    from public.nearest_routes(0.0001, 0.17) n join public.routes r on r.id = n.route_id
    where n.route_id = '00000000-0000-0000-0000-0000000000a5'$q$));
-- Pin past r5's end: the per-km fare (28.26) is capped at the full-route guide (25).
select pg_temp.expect('a drop at the end of the line pays at most the guide fare', 'true',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select (fare_regular = guide_fare_regular and drop_km > 11)::text from public.nearest_routes(0, 0.21) where route_id = '00000000-0000-0000-0000-0000000000a5'$q$));
select pg_temp.expect('a tricycle route without a line pays its guide fare, dropped at its destination', 'true',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select (fare_regular = guide_fare_regular and drop_km is null and drop_lat = 0 and drop_lng = 0.03)::text from public.nearest_routes(0, 0.03) where route_id = '00000000-0000-0000-0000-0000000000a2'$q$));
-- greatest() ignores nulls, so a lineless jeepney could slip into the per-km path; its null discounted guide would show it.
select pg_temp.expect('a jeepney route without a line keeps its guide fares', 'true',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', $q$select (fare_regular = guide_fare_regular and fare_discounted is not distinct from guide_fare_discounted and drop_km is null)::text from public.nearest_routes(0, 0.05) where route_id = '00000000-0000-0000-0000-0000000000a3'$q$));

select pg_temp.expect('at most 10 results', 'true',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select (count(*) <= 10)::text from public.nearest_routes(0, 0)'));
select pg_temp.expect('a pin outside the map is rejected', 'err:22023',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select count(*) from public.nearest_routes(123, 13)'));
select pg_temp.expect('half a location is rejected', 'err:22023',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select count(*) from public.nearest_routes(0, 0.01, 0, null)'));
select pg_temp.expect('a route line that is not a LineString is refused', 'err:23514',
  pg_temp.try_owner($q$update public.routes set route_line = '{"type": "Point", "coordinates": [0, 0]}'
                       where id = '00000000-0000-0000-0000-0000000000a2'$q$));
-- PostGIS may parse an empty line or reject it outright; either way it must not get in.
select pg_temp.expect('an empty route line is refused', 'refused',
  case when pg_temp.try_owner($q$update public.routes set route_line = '{"type": "LineString", "coordinates": []}'
                                 where id = '00000000-0000-0000-0000-0000000000a2'$q$) like 'err:%'
       then 'refused' else 'accepted' end);

-- Report by raising an error: the SQL Editor and CLI show only the last statement's output, and an
-- error is the one ending that always rolls the test data back, wherever this file is run.
do $$
begin
  raise exception E'nearest_routes (this error is on purpose, it rolls everything back): % of % PASS\n%',
    (select count(*) from results where got is not distinct from expected),
    (select count(*) from results),
    coalesce((select string_agg(format('FAIL %s. %s (expected %s, got %s)', n, check_name, expected, got),
                                E'\n' order by n)
              from results where got is distinct from expected), 'no failures');
end;
$$;

rollback;
