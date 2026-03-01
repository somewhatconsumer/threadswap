-- Threadswap: profiles (synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Categories for clothing types
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

insert into public.categories (name, slug) values
  ('Tops', 'tops'),
  ('Dresses', 'dresses'),
  ('Jackets', 'jackets'),
  ('Pants', 'pants'),
  ('Shoes', 'shoes'),
  ('Accessories', 'accessories'),
  ('Other', 'other')
on conflict (slug) do nothing;

-- Posts (swap listings with location as lat/lng for simplicity; no PostGIS required)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  lat double precision not null,
  lng double precision not null,
  address_label text,
  image_urls text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_lat_lng_idx on public.posts (lat, lng);

-- Messages: one row per message; conversations are grouped by (post_id, sender_id, receiver_id)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists messages_post_id_idx on public.messages (post_id);
create index if not exists messages_sender_receiver_idx on public.messages (sender_id, receiver_id);

-- Trigger: create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: updated_at for profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
