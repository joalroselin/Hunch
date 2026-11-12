create table public.creator_posts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text not null,
  channel text not null check (channel in ('Instagram', 'TikTok', 'Facebook')),
  post_date date,
  status text not null check (status in ('Draft', 'Planned', 'Posted')),
  reach bigint check (reach is null or reach >= 0),
  engagements bigint check (engagements is null or engagements >= 0),
  is_sample boolean not null default false,
  updated_at timestamptz not null default now()
);

create index creator_posts_user_date_idx on public.creator_posts (user_id, post_date);
alter table public.creator_posts enable row level security;

create policy "Users can read their own posts"
  on public.creator_posts for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can create their own posts"
  on public.creator_posts for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update their own posts"
  on public.creator_posts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete their own posts"
  on public.creator_posts for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.creator_posts to authenticated;
