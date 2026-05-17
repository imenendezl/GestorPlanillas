create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('Pending', 'Active', 'Rejected', 'Disabled');
  end if;
end;
$$;

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.hospitals (name)
values ('Hospital principal')
on conflict (name) do nothing;

alter table public.units
add column if not exists id uuid default gen_random_uuid(),
add column if not exists hospital_id uuid references public.hospitals(id);

update public.units
set hospital_id = (select id from public.hospitals where name = 'Hospital principal' limit 1)
where hospital_id is null;

alter table public.units
alter column id set not null,
alter column hospital_id set not null;

create unique index if not exists units_id_key on public.units (id);
create unique index if not exists units_hospital_name_key on public.units (hospital_id, name);

alter table public.users
add column if not exists status public.user_status not null default 'Pending',
add column if not exists hospital_id uuid references public.hospitals(id),
add column if not exists unit_id uuid;

update public.users as app_user
set hospital_id = unit.hospital_id,
    unit_id = unit.id,
    status = case when app_user.role in ('Admin', 'Supervisor') then 'Active'::public.user_status else app_user.status end
from public.units as unit
where app_user.unit = unit.name
  and (app_user.hospital_id is null or app_user.unit_id is null);

alter table public.users
alter column hospital_id set not null,
alter column unit_id set not null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'users'
      and constraint_name = 'users_unit_id_fkey'
  ) then
    alter table public.users
    add constraint users_unit_id_fkey foreign key (unit_id) references public.units(id);
  end if;
end;
$$;

create table if not exists public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  position public.user_position,
  code_hash text not null,
  active boolean not null default true,
  max_uses integer,
  uses integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitation_codes_lookup_idx
on public.invitation_codes (active, unit_id, hospital_id);

create index if not exists users_mobile_scope_idx
on public.users (hospital_id, unit_id, position, status);

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and status = 'Active'
  )
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
      on target.hospital_id = viewer.hospital_id
     and target.unit_id = viewer.unit_id
     and target.position = viewer.position
    where viewer.id = auth.uid()
      and viewer.status = 'Active'
      and target.id = target_user_id
      and target.status = 'Active'
  )
$$;

create or replace function public.claim_invitation(
  invitation_code text,
  first_name_input text,
  last_name_input text,
  position_input public.user_position default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
  matched_invitation public.invitation_codes%rowtype;
  resolved_position public.user_position;
  resolved_unit_name text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  select email into current_email
  from auth.users
  where id = auth.uid();

  select *
  into matched_invitation
  from public.invitation_codes
  where active = true
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses < max_uses)
    and crypt(invitation_code, code_hash) = code_hash
  order by created_at desc
  limit 1;

  if matched_invitation.id is null then
    raise exception 'Código de invitación no válido.';
  end if;

  resolved_position := coalesce(matched_invitation.position, position_input);

  if resolved_position is null then
    raise exception 'No se pudo resolver la categoría profesional.';
  end if;

  select name into resolved_unit_name
  from public.units
  where id = matched_invitation.unit_id;

  insert into public.users (
    id,
    first_name,
    last_name,
    email,
    unit,
    hospital_id,
    unit_id,
    position,
    role,
    status
  )
  values (
    auth.uid(),
    trim(first_name_input),
    trim(last_name_input),
    lower(current_email),
    resolved_unit_name,
    matched_invitation.hospital_id,
    matched_invitation.unit_id,
    resolved_position,
    'Employee',
    'Pending'
  )
  on conflict (id) do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      unit = excluded.unit,
      hospital_id = excluded.hospital_id,
      unit_id = excluded.unit_id,
      position = excluded.position,
      status = case
        when public.users.status = 'Active' then public.users.status
        else 'Pending'::public.user_status
      end,
      updated_at = now();

  update public.invitation_codes
  set uses = uses + 1,
      updated_at = now()
  where id = matched_invitation.id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_unit text;
  requested_position public.user_position;
  resolved_unit public.units%rowtype;
begin
  requested_unit := coalesce(nullif(new.raw_user_meta_data ->> 'unit', ''), 'Urgencias');
  requested_position := coalesce(nullif(new.raw_user_meta_data ->> 'position', '')::public.user_position, 'Nurse');

  select *
  into resolved_unit
  from public.units
  where name = requested_unit
  order by created_at asc
  limit 1;

  if resolved_unit.id is null then
    insert into public.units (name, hospital_id)
    values (
      requested_unit,
      (select id from public.hospitals where name = 'Hospital principal' limit 1)
    )
    returning * into resolved_unit;
  end if;

  insert into public.users (
    id,
    first_name,
    last_name,
    email,
    unit,
    hospital_id,
    unit_id,
    position,
    role,
    status
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'firstName', ''), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'lastName', ''), ''),
    lower(new.email),
    resolved_unit.name,
    resolved_unit.hospital_id,
    resolved_unit.id,
    requested_position,
    'Employee',
    'Pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

alter table public.hospitals enable row level security;
alter table public.invitation_codes enable row level security;

drop policy if exists "Active users can read hospitals" on public.hospitals;
create policy "Active users can read hospitals"
on public.hospitals for select
using (
  public.is_active_user()
  and exists (
    select 1 from public.users
    where users.id = auth.uid()
      and users.hospital_id = hospitals.id
  )
);

drop policy if exists "Active users can read invitation units" on public.units;
create policy "Active users can read invitation units"
on public.units for select
using (
  public.is_active_user()
  and exists (
    select 1 from public.users
    where users.id = auth.uid()
      and users.hospital_id = units.hospital_id
  )
);

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
using (id = auth.uid());

drop policy if exists "Users can read same staff group" on public.users;
create policy "Users can read same staff group"
on public.users for select
using (public.same_staff_group(id));

drop policy if exists "Users can create own shifts" on public.shifts;
create policy "Users can create own shifts"
on public.shifts for insert
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "Users can update own shifts" on public.shifts;
create policy "Users can update own shifts"
on public.shifts for update
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid() and public.is_active_user());

drop policy if exists "Users can delete own shifts" on public.shifts;
create policy "Users can delete own shifts"
on public.shifts for delete
using (user_id = auth.uid() and public.is_active_user());

drop policy if exists "Users can read own shifts" on public.shifts;
create policy "Users can read own shifts"
on public.shifts for select
using (user_id = auth.uid() and public.is_active_user());

drop trigger if exists hospitals_touch_updated_at on public.hospitals;
create trigger hospitals_touch_updated_at
before update on public.hospitals
for each row execute function public.touch_updated_at();

drop trigger if exists invitation_codes_touch_updated_at on public.invitation_codes;
create trigger invitation_codes_touch_updated_at
before update on public.invitation_codes
for each row execute function public.touch_updated_at();
