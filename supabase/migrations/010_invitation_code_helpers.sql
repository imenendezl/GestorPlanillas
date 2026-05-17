create or replace function public.set_invitation_code(
  unit_name_input text,
  invitation_code_input text,
  position_input public.user_position default 'Nurse',
  max_uses_input integer default null,
  expires_at_input timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_hospital_id uuid;
  target_unit_id uuid;
  created_code_id uuid;
  normalized_unit_name text;
  normalized_code text;
begin
  if auth.uid() is not null and not public.can_manage_roles() then
    raise exception 'No tienes permisos para crear códigos de invitación.';
  end if;

  normalized_unit_name := trim(unit_name_input);
  normalized_code := trim(invitation_code_input);

  if normalized_unit_name is null or normalized_unit_name = '' then
    raise exception 'Indica una unidad/servicio.';
  end if;

  if normalized_code is null or normalized_code = '' then
    raise exception 'Indica un código de invitación.';
  end if;

  select id into target_hospital_id
  from public.hospitals
  order by created_at asc
  limit 1;

  if target_hospital_id is null then
    insert into public.hospitals (name)
    values ('Hospital principal')
    returning id into target_hospital_id;
  end if;

  select id into target_unit_id
  from public.units
  where name = normalized_unit_name
  order by created_at asc
  limit 1;

  if target_unit_id is null then
    insert into public.units (name, hospital_id)
    values (normalized_unit_name, target_hospital_id)
    returning id into target_unit_id;
  end if;

  update public.invitation_codes
  set active = false,
      updated_at = now()
  where unit_id = target_unit_id
    and active = true;

  insert into public.invitation_codes (
    hospital_id,
    unit_id,
    position,
    code_hash,
    active,
    max_uses,
    expires_at
  )
  values (
    target_hospital_id,
    target_unit_id,
    position_input,
    extensions.crypt(normalized_code, extensions.gen_salt('bf')),
    true,
    max_uses_input,
    expires_at_input
  )
  returning id into created_code_id;

  return created_code_id;
end;
$$;

grant execute on function public.set_invitation_code(text, text, public.user_position, integer, timestamptz) to authenticated;
