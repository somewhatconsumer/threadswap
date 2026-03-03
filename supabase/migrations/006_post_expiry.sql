-- Posts expire 14 days after creation to reduce clutter
alter table public.posts
  add column if not exists expires_at timestamptz;

-- Backfill existing rows
update public.posts
set expires_at = created_at + interval '14 days'
where expires_at is null;

-- New and updated rows: set expires_at on insert
create or replace function public.set_post_expires_at()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.created_at + interval '14 days';
  return new;
end;
$$;

drop trigger if exists posts_set_expires_at on public.posts;
create trigger posts_set_expires_at
  before insert on public.posts
  for each row execute function public.set_post_expires_at();

-- Index for filtering active (non-expired) posts
create index if not exists posts_expires_at_idx on public.posts (expires_at);
