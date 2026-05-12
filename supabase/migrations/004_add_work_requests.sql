do $$
begin
  if not exists (select 1 from pg_type where typname = 'work_request_status') then
    create type public.work_request_status as enum ('Open', 'Cancelled', 'Approved', 'Rejected');
  end if;
end;
$$;

create table if not exists public.work_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  request_date date not null,
  status public.work_request_status not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_date, status)
);

create index if not exists work_requests_user_date_idx on public.work_requests (user_id, request_date);
create index if not exists work_requests_status_idx on public.work_requests (status);

drop trigger if exists work_requests_touch_updated_at on public.work_requests;
create trigger work_requests_touch_updated_at
before update on public.work_requests
for each row execute function public.touch_updated_at();

alter table public.work_requests enable row level security;

drop policy if exists "Users can read own work requests" on public.work_requests;
create policy "Users can read own work requests"
on public.work_requests for select
using (user_id = auth.uid());

drop policy if exists "Managers can read work requests" on public.work_requests;
create policy "Managers can read work requests"
on public.work_requests for select
using (public.can_manage_roles());

drop policy if exists "Users can create own work requests" on public.work_requests;
create policy "Users can create own work requests"
on public.work_requests for insert
with check (user_id = auth.uid());

drop policy if exists "Users can cancel own work requests" on public.work_requests;
create policy "Users can cancel own work requests"
on public.work_requests for update
using (user_id = auth.uid())
with check (user_id = auth.uid() and status = 'Cancelled');
