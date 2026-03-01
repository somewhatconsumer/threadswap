-- Add categories array for multi-category posts; keep category for backward compat
alter table public.posts add column if not exists categories text[] default '{}';

-- Backfill from single category
update public.posts set categories = array[category] where categories is null or categories = '{}';

-- RLS unchanged (posts policies already cover insert/update)
