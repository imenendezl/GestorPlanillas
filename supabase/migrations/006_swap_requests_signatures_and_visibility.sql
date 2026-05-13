do $$
begin
  if not exists (select 1 from pg_type where typname = 'swap_mode') then
    create type public.swap_mode as enum ('Exchange', 'Coverage');
  end if;
end;
$$;

alter table public.swap_requests
add column if not exists mode public.swap_mode not null default 'Exchange',
add column if not exists requested_date date,
add column if not exists requested_shift_codes text[] not null default array[]::text[],
add column if not exists accepter_previous_shift_codes text[] not null default array[]::text[],
add column if not exists accepted_date date,
add column if not exists requester_signed_at timestamptz,
add column if not exists accepter_signed_at timestamptz;

update public.swap_requests as request
set requested_date = coalesce(request.requested_date, shift.shift_date),
    requested_shift_codes = case
      when cardinality(request.requested_shift_codes) = 0 then shift.shift_codes
      else request.requested_shift_codes
    end
from public.shifts as shift
where request.shift_id = shift.id;

create index if not exists swap_requests_requester_status_idx
on public.swap_requests (requester_id, status);

create index if not exists swap_requests_signature_pending_idx
on public.swap_requests (status, requester_signed_at, accepter_signed_at)
where status = 'Accepted';

create index if not exists work_requests_status_date_idx
on public.work_requests (status, request_date);

drop policy if exists "Users can read same staff group shifts" on public.shifts;
create policy "Users can read same staff group shifts"
on public.shifts for select
using (public.same_staff_group(user_id));

drop policy if exists "Users can accept visible swap requests" on public.swap_requests;
create policy "Users can accept visible swap requests"
on public.swap_requests for update
using (
  status = 'Open'
  and requester_id <> auth.uid()
  and public.same_staff_group(requester_id)
)
with check (
  status in ('Accepted', 'Open')
  and requester_id <> auth.uid()
  and public.same_staff_group(requester_id)
);

drop policy if exists "Swap participants can update signatures" on public.swap_requests;
create policy "Swap participants can update signatures"
on public.swap_requests for update
using (
  status = 'Accepted'
  and (requester_id = auth.uid() or accepted_by = auth.uid())
)
with check (
  status = 'Accepted'
  and (requester_id = auth.uid() or accepted_by = auth.uid())
);

drop policy if exists "Visible open work requests by staff group" on public.work_requests;
create policy "Visible open work requests by staff group"
on public.work_requests for select
using (
  status = 'Open'
  and user_id <> auth.uid()
  and public.same_staff_group(user_id)
);
