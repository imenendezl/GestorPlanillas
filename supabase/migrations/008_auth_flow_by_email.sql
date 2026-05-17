create or replace function public.get_auth_flow_for_email(email_input text)
returns table (requires_signup boolean)
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.users
    where email = lower(trim(email_input))
    limit 1
  ) as requires_signup;
$$;

grant execute on function public.get_auth_flow_for_email(text) to anon, authenticated;
