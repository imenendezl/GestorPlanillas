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
  normalized_code text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión.';
  end if;

  normalized_code := trim(invitation_code);

  if normalized_code is null or normalized_code = '' then
    raise exception 'Código de invitación no válido.';
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
    and (
      code_hash in (normalized_code, upper(normalized_code), lower(normalized_code))
      or (
        code_hash ~ '^\$[[:alnum:]]+\$'
        and (
          extensions.crypt(normalized_code, code_hash) = code_hash
          or extensions.crypt(upper(normalized_code), code_hash) = code_hash
          or extensions.crypt(lower(normalized_code), code_hash) = code_hash
        )
      )
    )
  order by created_at desc
  limit 1;

  if matched_invitation.id is null then
    raise exception 'Código de invitación no válido.';
  end if;

  resolved_position := coalesce(matched_invitation.position, position_input, 'Nurse'::public.user_position);

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

drop trigger if exists on_auth_user_created on auth.users;
