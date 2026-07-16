-- Réactive la photo facultative dans le dossier de candidature existant.
alter table public.applications
  add column if not exists photo_path text;

comment on column public.applications.photo_path is
  'Chemin privé de la photo facultative dans le bucket application-files.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'application-files',
  'application-files',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
