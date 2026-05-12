alter table public.users
add column if not exists email text;

update public.users as profile
set email = lower(auth_user.email)
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.email is null;

create unique index if not exists users_email_unique_idx
on public.users (email);

alter table public.users
alter column email set not null;

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
