-- 1. Rôles & sécurité
create type public.app_role as enum ('admin', 'moderator');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select, insert, update, delete on public.user_roles to service_role;
grant select on public.user_roles to authenticated;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create policy "Users can read their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2. Trigger updated_at générique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Candidatures Victorious
create type public.application_status as enum (
  'pending', 'reviewing', 'shortlisted', 'rejected', 'winner'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  testimony text not null,
  photo_path text,
  document_path text,
  status public.application_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_created_at_idx on public.applications (created_at desc);
create index applications_status_idx on public.applications (status);
create index applications_category_idx on public.applications (category_slug);

grant insert on public.applications to anon, authenticated;
grant select, update, delete on public.applications to authenticated;
grant select, insert, update, delete on public.applications to service_role;

alter table public.applications enable row level security;

create policy "Anyone can submit an application"
  on public.applications for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read all applications"
  on public.applications for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update applications"
  on public.applications for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete applications"
  on public.applications for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- 4. Storage policies pour le bucket privé "application-files"
create policy "Anyone can upload application files"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'application-files');

create policy "Admins can read application files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'application-files'
    and public.has_role(auth.uid(), 'admin')
  );

create policy "Admins can delete application files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'application-files'
    and public.has_role(auth.uid(), 'admin')
  );
