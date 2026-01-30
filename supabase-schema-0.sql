-- Create a function that inserts a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

-- Create a trigger that fires after a new user is inserted
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

  insert into public.profiles (id, display_name)
select id, raw_user_meta_data ->> 'full_name'
from auth.users
where id not in (select id from public.profiles);

-- Enable RLS on profiles (likely already enabled)
alter table public.profiles enable row level security;

-- Allow authenticated users to read all profiles
create policy "Authenticated users can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Allow users to update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);