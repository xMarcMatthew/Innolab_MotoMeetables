-- Read-only RLS check (integrator, before each merge). Paste into the SQL Editor; every row should read OK.

with app_tables as (
  select c.oid, c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
app_functions as (
  select p.oid, p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
)
select 'RLS on: ' || relname as check,
       case when relrowsecurity then 'OK' else 'FAIL' end as result
from app_tables
union all
select 'logged-out users cannot read: ' || relname,
       case when has_table_privilege('anon', oid, 'select') then 'FAIL' else 'OK' end
from app_tables
union all
select 'logged-out users cannot run: ' || proname,
       case when has_function_privilege('anon', oid, 'execute') then 'FAIL' else 'OK' end
from app_functions
union all
select 'app cannot change profiles.role',
       case when has_column_privilege('authenticated', 'public.profiles', 'role', 'update') then 'FAIL' else 'OK' end
union all
select 'app cannot change profiles.coop_id',
       case when has_column_privilege('authenticated', 'public.profiles', 'coop_id', 'update') then 'FAIL' else 'OK' end
order by 2 desc, 1;
