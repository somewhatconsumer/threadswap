-- Feedback / contact submissions: anyone can submit; you read in Supabase dashboard
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  name text,
  email text,
  message text not null,
  user_id uuid references public.profiles (id) on delete set null
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Anyone (including anon) can insert a feedback row
create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (true);

-- No select/update/delete from client; read submissions in Supabase Table Editor or add an admin view later
-- (To allow only you to read, add a policy like: using (auth.uid() = 'your-user-uuid'))
