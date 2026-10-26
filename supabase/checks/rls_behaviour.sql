-- RLS behaviour check: acts as real users and expects each attempt to succeed or fail.
-- Runs inside a transaction that is ALWAYS rolled back, so it leaves no data behind.
-- Paste into the SQL Editor (or: npx supabase db query --linked -f supabase/checks/rls_behaviour.sql).
-- It ends with an error on purpose; the message should read "31 of 31 PASS" and "no failures".

begin;

create temp table results (n serial, check_name text, expected text, got text);

-- Runs one statement as a user (null = logged out) and reports 'rows=N' or 'err:SQLSTATE'.
create function pg_temp.try_exec(p_uid uuid, p_sql text) returns text language plpgsql as $$
declare n bigint; r text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
  if p_uid is null then set local role anon; else set local role authenticated; end if;
  begin
    execute p_sql;
    get diagnostics n = row_count;
    r := 'rows=' || n;
  exception when others then
    r := 'err:' || sqlstate;
  end;
  reset role;
  return r;
end $$;

-- Same, but returns the single value a query produces.
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

create function pg_temp.expect(p_check text, p_expected text, p_got text) returns void language sql as $$
  insert into results (check_name, expected, got) values (p_check, p_expected, p_got);
$$;

-- Fixtures, as the table owner. A commuter (who tries to sign up as a coop), a coop user, two drivers.
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', '{"full_name": "Commuter A", "role": "coop"}'),
  ('00000000-0000-0000-0000-00000000000b', '{"full_name": "Coop B"}'),
  ('00000000-0000-0000-0000-00000000000d', '{"full_name": "Driver D"}'),
  ('00000000-0000-0000-0000-00000000000e', '{"full_name": "Driver E"}');

insert into public.coops (id, name, type) values
  ('00000000-0000-0000-0000-0000000000c1', 'Test Coop One', 'jeepney_coop'),
  ('00000000-0000-0000-0000-0000000000c2', 'Test Coop Two', 'toda');

update public.profiles set role = 'coop', coop_id = '00000000-0000-0000-0000-0000000000c1'
where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set role = 'driver', coop_id = '00000000-0000-0000-0000-0000000000c1'
where id = '00000000-0000-0000-0000-00000000000d';
update public.profiles set role = 'driver', coop_id = '00000000-0000-0000-0000-0000000000c2'
where id = '00000000-0000-0000-0000-00000000000e';

insert into public.terminals (id, coop_id, name, lat, lng) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1', 'Test Terminal One', 13.62, 123.18),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000c2', 'Test Terminal Two', 13.63, 123.19);

insert into public.routes (id, terminal_id, destination_name, destination_lat, destination_lng, vehicle_type, guide_fare_regular) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'Test Place One', 13.64, 123.20, 'jeepney', 14),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000f2', 'Test Place Two', 13.65, 123.21, 'tricycle', 20);

insert into public.vehicles (id, coop_id, route_id, plate, vehicle_type, driver_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'TEST-001', 'jeepney', '00000000-0000-0000-0000-00000000000d'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'TEST-002', 'jeepney', null);

insert into public.vehicle_tokens (vehicle_id) values ('00000000-0000-0000-0000-0000000000b1');
insert into public.boardings (commuter_id, vehicle_id) values
  ('00000000-0000-0000-0000-00000000000e', '00000000-0000-0000-0000-0000000000b1');

-- Logged out
select pg_temp.expect('logged out: cannot read coops', 'err:42501',
  pg_temp.try_val(null, 'select count(*) from public.coops'));
select pg_temp.expect('logged out: cannot read vehicles', 'err:42501',
  pg_temp.try_val(null, 'select count(*) from public.vehicles'));
select pg_temp.expect('logged out: cannot run set_vehicle_status', 'err:42501',
  pg_temp.try_exec(null, $q$select public.set_vehicle_status('loading')$q$));

-- Sign-up and profiles (A is a commuter)
select pg_temp.expect('sign-up ignores a role in sign-up data', 'commuter',
  (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a'));
select pg_temp.expect('commuter cannot make themselves a coop', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000a', $q$update public.profiles set role = 'coop' where id = '00000000-0000-0000-0000-00000000000a'$q$));
select pg_temp.expect('commuter can rename themselves', 'rows=1',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000a', $q$update public.profiles set full_name = 'Renamed' where id = '00000000-0000-0000-0000-00000000000a'$q$));
select pg_temp.expect('commuter sees only their own profile', '1',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select count(*) from public.profiles'));
select pg_temp.expect('commuter cannot add a terminal', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000a', $q$insert into public.terminals (coop_id, name, lat, lng) values ('00000000-0000-0000-0000-0000000000c1', 'X', 13, 123)$q$));
select pg_temp.expect('commuter cannot write positions', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000a', $q$insert into public.vehicle_positions (vehicle_id, lat, lng) values ('00000000-0000-0000-0000-0000000000b1', 13, 123)$q$));
select pg_temp.expect('commuter cannot read another driver''s board token', '0',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select count(*) from public.vehicle_tokens'));
select pg_temp.expect('commuter cannot read someone else''s trips', '0',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000a', 'select count(*) from public.boardings'));
select pg_temp.expect('commuter cannot set a vehicle status', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000a', $q$select public.set_vehicle_status('loading')$q$));

-- Coop user B (coop One)
select pg_temp.expect('coop sees itself and its own driver only', '2',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000b', 'select count(*) from public.profiles'));
select pg_temp.expect('coop cannot see another coop''s driver', '0',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000b', $q$select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000e'$q$));
select pg_temp.expect('coop adds a terminal to their own coop', 'rows=1',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$insert into public.terminals (coop_id, name, lat, lng) values ('00000000-0000-0000-0000-0000000000c1', 'New', 13, 123)$q$));
select pg_temp.expect('coop cannot add a terminal to another coop', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$insert into public.terminals (coop_id, name, lat, lng) values ('00000000-0000-0000-0000-0000000000c2', 'Sneaky', 13, 123)$q$));
select pg_temp.expect('a location outside the map is rejected', 'err:23514',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$insert into public.terminals (coop_id, name, lat, lng) values ('00000000-0000-0000-0000-0000000000c1', 'Bad', 123, 13)$q$));
select pg_temp.expect('coop cannot edit another coop''s terminal', 'rows=0',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$update public.terminals set name = 'Hacked' where id = '00000000-0000-0000-0000-0000000000f2'$q$));
select pg_temp.expect('coop cannot edit another coop''s fare guide', 'rows=0',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$update public.routes set guide_fare_regular = 99 where id = '00000000-0000-0000-0000-0000000000a2'$q$));
select pg_temp.expect('coop cannot put a vehicle on another coop''s route', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$insert into public.vehicles (coop_id, route_id, plate, vehicle_type) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a2', 'TEST-009', 'tricycle')$q$));
select pg_temp.expect('coop cannot move a vehicle to another coop', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000b', $q$update public.vehicles set coop_id = '00000000-0000-0000-0000-0000000000c2' where id = '00000000-0000-0000-0000-0000000000b2'$q$));

-- Driver D (assigned to TEST-001)
select pg_temp.expect('driver sets their status', 'rows=1',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000d', $q$select public.set_vehicle_status('loading')$q$));
select pg_temp.expect('driver status is stored', 'loading',
  (select status from public.vehicles where id = '00000000-0000-0000-0000-0000000000b1'));
select pg_temp.expect('driver cannot set an unknown status', 'err:22023',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000d', $q$select public.set_vehicle_status('flying')$q$));
select pg_temp.expect('driver cannot set a negative fare', 'err:22023',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000d', $q$select public.set_my_fare(-5)$q$));
select pg_temp.expect('driver sets their fare', 'rows=1',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000d', $q$select public.set_my_fare(15.555)$q$));
select pg_temp.expect('driver fare is rounded to centavos', '15.56',
  (select driver_fare::text from public.vehicles where id = '00000000-0000-0000-0000-0000000000b1'));
select pg_temp.expect('driver cannot edit the vehicle row directly', 'rows=0',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000d', $q$update public.vehicles set driver_fare = 1 where id = '00000000-0000-0000-0000-0000000000b1'$q$));
select pg_temp.expect('driver reads their own board token', '1',
  pg_temp.try_val('00000000-0000-0000-0000-00000000000d', 'select count(*) from public.vehicle_tokens'));
select pg_temp.expect('driver with no vehicle cannot set a status', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000e', $q$select public.set_vehicle_status('loading')$q$));

-- A coop wrongly assigns commuter A as a driver: the driver functions still refuse them.
update public.vehicles set driver_id = '00000000-0000-0000-0000-00000000000a'
where id = '00000000-0000-0000-0000-0000000000b2';
select pg_temp.expect('commuter assigned as driver still cannot set status', 'err:42501',
  pg_temp.try_exec('00000000-0000-0000-0000-00000000000a', $q$select public.set_vehicle_status('loading')$q$));

-- Report by raising an error: the SQL Editor and CLI show only the last statement's output, and an
-- error is the one ending that always rolls the test data back, wherever this file is run.
do $$
begin
  -- Tally first, then only the failures: the Management API cuts long error messages short.
  raise exception E'RLS behaviour (this error is on purpose, it rolls everything back): % of % PASS\n%',
    (select count(*) from results where got is not distinct from expected),
    (select count(*) from results),
    coalesce((select string_agg(format('FAIL %s. %s (expected %s, got %s)', n, check_name, expected, got),
                                E'\n' order by n)
              from results where got is distinct from expected), 'no failures');
end;
$$;

rollback;
