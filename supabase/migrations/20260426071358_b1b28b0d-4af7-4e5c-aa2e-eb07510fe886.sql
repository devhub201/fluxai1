-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- chats
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  model text not null default 'google/gemini-3-flash-preview',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.chats enable row level security;
create index chats_user_id_idx on public.chats(user_id, updated_at desc);

create policy "chats_select_own" on public.chats for select to authenticated using (auth.uid() = user_id);
create policy "chats_insert_own" on public.chats for insert to authenticated with check (auth.uid() = user_id);
create policy "chats_update_own" on public.chats for update to authenticated using (auth.uid() = user_id);
create policy "chats_delete_own" on public.chats for delete to authenticated using (auth.uid() = user_id);

create trigger chats_updated_at before update on public.chats
  for each row execute procedure public.set_updated_at();

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index messages_chat_id_idx on public.messages(chat_id, created_at);

create policy "messages_select_own" on public.messages for select to authenticated using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete to authenticated using (auth.uid() = user_id);
