alter table public.applications
  add column civility text not null default 'Non renseignée'
  check (civility in ('Madame', 'Monsieur', 'Non renseignée'));

comment on column public.applications.civility is
  'Civilité déclarée par le candidat. Non renseignée identifie les candidatures antérieures à cette migration.';

alter table public.applications
  alter column civility drop default;
