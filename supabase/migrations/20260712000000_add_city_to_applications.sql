alter table public.applications
  add column city text not null default 'Non renseignée';

alter table public.applications
  alter column city drop default;
