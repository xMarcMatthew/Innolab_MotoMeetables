-- Migration 6: drivers set their own payment QR (QR Ph code text) on their vehicle.
-- The coop is a back office, so the driver is the commuter's payment contact. We never hold money.
-- payment_qr_by_driver is true when the driver set the current QR, so the coop can see a swapped QR.
-- Drivers change payment_qr only through set_my_payment_qr: the vehicles update policy is for coop users only.

alter table public.vehicles add column if not exists payment_qr_by_driver boolean not null default false;

create or replace function public.set_my_payment_qr(p_qr text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Null or empty clears it.
  if p_qr is null or p_qr = '' then
    update public.vehicles v
    set payment_qr = null, payment_qr_by_driver = false
    where v.driver_id = (select auth.uid())
      and exists (select 1 from public.profiles p where p.id = v.driver_id and p.role = 'driver');
  else
    -- Format guard only; the app checks the CRC-16 (src/lib/qrph.ts).
    if char_length(p_qr) > 1000 or p_qr !~ '^000201' or p_qr !~ '6304[0-9A-Fa-f]{4}$' then
      raise exception 'invalid QR Ph code' using errcode = '22023';
    end if;

    update public.vehicles v
    set payment_qr = p_qr, payment_qr_by_driver = true
    where v.driver_id = (select auth.uid())
      and exists (select 1 from public.profiles p where p.id = v.driver_id and p.role = 'driver');
  end if;

  if not found then
    raise exception 'no vehicle assigned to this driver' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.set_my_payment_qr(text) from public, anon;
grant execute on function public.set_my_payment_qr(text) to authenticated;
