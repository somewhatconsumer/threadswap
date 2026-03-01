-- Row Level Security

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.messages enable row level security;

-- Profiles: users can read all (for display names), update only own
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Categories: read-only for everyone
create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- Posts: anyone can read; only authenticated can insert; only owner can update/delete
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Messages: users can read messages where they are sender or receiver
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Allow reading post and receiver for displaying conversation context (handled by select policy above)
-- No update/delete policies: messages are append-only
