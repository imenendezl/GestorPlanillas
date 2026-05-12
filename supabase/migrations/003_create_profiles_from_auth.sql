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

  insert into public.users (id, first_name, last_name, unit, position, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'firstName', ''), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'lastName', ''), ''),
    requested_unit,
    requested_position,
    'Employee'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
