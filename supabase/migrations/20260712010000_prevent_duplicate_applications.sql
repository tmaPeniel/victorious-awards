create or replace function public.prevent_duplicate_application_same_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(new.email));
begin
  -- Serialise les candidatures concurrentes portant sur le même e-mail et la
  -- même catégorie, sans supprimer d'éventuels doublons historiques.
  perform pg_advisory_xact_lock(
    hashtextextended(normalized_email || ':' || new.category_slug, 0)
  );

  if exists (
    select 1
    from public.applications
    where lower(trim(email)) = normalized_email
      and category_slug = new.category_slug
      and id <> new.id
  ) then
    raise exception using
      errcode = '23505',
      message = 'duplicate_application_same_category';
  end if;

  new.email := normalized_email;
  return new;
end;
$$;

drop trigger if exists applications_prevent_duplicate_same_category
  on public.applications;

create trigger applications_prevent_duplicate_same_category
  before insert or update of email, category_slug
  on public.applications
  for each row
  execute function public.prevent_duplicate_application_same_category();
