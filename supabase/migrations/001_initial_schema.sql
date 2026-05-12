create type public.user_position as enum ('Nurse', 'TMSCAE');
create type public.user_role as enum ('Admin', 'Supervisor', 'Employee');
create type public.swap_status as enum ('Open', 'Accepted', 'Cancelled');
create type public.work_request_status as enum ('Open', 'Cancelled', 'Approved', 'Rejected');

create table public.units (
  name text primary key,
  created_at timestamptz not null default now()
);

insert into public.units (name)
values ('Urgencias')
on conflict (name) do nothing;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  unit text not null references public.units(name),
  position public.user_position not null,
  role public.user_role not null default 'Employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  shift_date date not null,
  shift_codes text[] not null default array['L'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, shift_date),
  constraint shifts_codes_allowed check (
    shift_codes <@ array['M', 'T', 'N', '-', 'L']::text[]
    and cardinality(shift_codes) between 1 and 2
    and (
      shift_codes = array['M']::text[]
      or shift_codes = array['T']::text[]
      or shift_codes = array['N']::text[]
      or shift_codes = array['-']::text[]
      or shift_codes = array['L']::text[]
      or shift_codes = array['M', 'T']::text[]
      or shift_codes = array['M', 'N']::text[]
      or shift_codes = array['T', 'N']::text[]
    )
  )
);

create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  status public.swap_status not null default 'Open',
  offered_shift_codes text[] not null,
  proposed_dates date[] not null default '{}',
  accepted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  request_date date not null,
  status public.work_request_status not null default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_date, status)
);

create index users_unit_position_idx on public.users (unit, position);
create index shifts_user_date_idx on public.shifts (user_id, shift_date);
create index swap_requests_status_idx on public.swap_requests (status);
create index work_requests_user_date_idx on public.work_requests (user_id, request_date);
create index work_requests_status_idx on public.work_requests (status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_unit text;
  requested_position public.user_position;
begin
  requested_unit := coalesce(nullif(new.raw_user_meta_data ->> 'unit', ''), 'Urgencias');
  requested_position := coalesce(nullif(new.raw_user_meta_data ->> 'position', '')::public.user_position, 'Nurse');

  insert into public.units (name)
  values (requested_unit)
  on conflict (name) do nothing;

  insert into public.users (id, first_name, last_name, email, unit, position, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'firstName', ''), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'lastName', ''), ''),
    lower(new.email),
    requested_unit,
    requested_position,
    'Employee'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger shifts_touch_updated_at
before update on public.shifts
for each row execute function public.touch_updated_at();

create trigger swap_requests_touch_updated_at
before update on public.swap_requests
for each row execute function public.touch_updated_at();

create trigger work_requests_touch_updated_at
before update on public.work_requests
for each row execute function public.touch_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.can_manage_roles()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('Admin', 'Supervisor'), false)
$$;

create or replace function public.same_staff_group(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users viewer
    join public.users target
      on target.unit = viewer.unit
     and target.position = viewer.position
    where viewer.id = auth.uid()
      and target.id = target_user_id
  )
$$;

alter table public.users enable row level security;
alter table public.units enable row level security;
alter table public.shifts enable row level security;
alter table public.swap_requests enable row level security;
alter table public.work_requests enable row level security;

create policy "Anyone can read units"
on public.units for select
using (true);

create policy "Users can insert own employee profile"
on public.users for insert
with check (id = auth.uid() and role = 'Employee');

create policy "Users can read own profile"
on public.users for select
using (id = auth.uid());

create policy "Users can read same staff group"
on public.users for select
using (public.same_staff_group(id));

create policy "Managers can read profiles"
on public.users for select
using (public.can_manage_roles());

create policy "Users can update own non-role profile"
on public.users for update
using (id = auth.uid())
with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));

create policy "Managers can update roles"
on public.users for update
using (public.can_manage_roles())
with check (public.can_manage_roles());

create policy "Users can read own shifts"
on public.shifts for select
using (user_id = auth.uid());

create policy "Managers can read shifts"
on public.shifts for select
using (public.can_manage_roles());

create policy "Users can create own shifts"
on public.shifts for insert
with check (user_id = auth.uid());

create policy "Users can update own shifts"
on public.shifts for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own shifts"
on public.shifts for delete
using (user_id = auth.uid());

create policy "Visible swap requests by staff group"
on public.swap_requests for select
using (public.same_staff_group(requester_id));

create policy "Users can create own swap requests"
on public.swap_requests for insert
with check (requester_id = auth.uid());

create policy "Users can cancel own swap requests"
on public.swap_requests for update
using (requester_id = auth.uid())
with check (requester_id = auth.uid());

create policy "Users can accept visible swap requests"
on public.swap_requests for update
using (
  status = 'Open'
  and requester_id <> auth.uid()
  and public.same_staff_group(requester_id)
)
with check (
  status = 'Accepted'
  and accepted_by = auth.uid()
  and public.same_staff_group(requester_id)
);

create policy "Users can delete own swap requests"
on public.swap_requests for delete
using (requester_id = auth.uid());

create policy "Users can read own work requests"
on public.work_requests for select
using (user_id = auth.uid());

create policy "Managers can read work requests"
on public.work_requests for select
using (public.can_manage_roles());

create policy "Users can create own work requests"
on public.work_requests for insert
with check (user_id = auth.uid());

create policy "Users can cancel own work requests"
on public.work_requests for update
using (user_id = auth.uid())
with check (user_id = auth.uid() and status = 'Cancelled');
