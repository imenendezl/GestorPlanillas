create table if not exists public.units (
  name text primary key,
  created_at timestamptz not null default now()
);

insert into public.units (name)
values ('Urgencias')
on conflict (name) do nothing;

alter table public.units enable row level security;

drop policy if exists "Authenticated users can read units" on public.units;
drop policy if exists "Anyone can read units" on public.units;
create policy "Anyone can read units"
on public.units for select
using (true);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'users'
      and constraint_name = 'users_unit_fkey'
  ) then
    alter table public.users
    add constraint users_unit_fkey foreign key (unit) references public.units(name);
  end if;
end;
$$;
