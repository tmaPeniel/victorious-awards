create type public.ticket_reservation_status as enum ('confirmed', 'waitlisted', 'cancelled');
create type public.ticket_attendee_status as enum ('active', 'cancelled', 'checked_in');

create table public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  starts_at timestamptz not null,
  venue text not null,
  city text not null,
  capacity integer check (capacity is null or capacity > 0),
  booking_enabled boolean not null default false,
  booking_opens_at timestamptz,
  booking_closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (booking_closes_at is null or booking_opens_at is null or booking_closes_at > booking_opens_at)
);

create table public.ticket_reservations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete restrict,
  reference text not null unique,
  contact_first_name text not null,
  contact_last_name text not null,
  contact_email text not null,
  contact_phone text not null,
  party_size smallint not null check (party_size between 1 and 4),
  status public.ticket_reservation_status not null,
  management_token_hash text not null unique,
  idempotency_key text not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, idempotency_key)
);

create table public.ticket_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ticket_events(id) on delete restrict,
  reservation_id uuid not null references public.ticket_reservations(id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  first_name text not null,
  last_name text not null,
  email text not null,
  ticket_token_hash text not null unique,
  status public.ticket_attendee_status not null default 'active',
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id, position)
);

create unique index ticket_attendees_active_email_idx
  on public.ticket_attendees (event_id, lower(trim(email)))
  where status <> 'cancelled';
create index ticket_reservations_event_status_created_idx
  on public.ticket_reservations (event_id, status, created_at);
create index ticket_attendees_reservation_status_idx
  on public.ticket_attendees (reservation_id, status);

create table public.ticket_email_log (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.ticket_reservations(id) on delete cascade,
  attendee_id uuid references public.ticket_attendees(id) on delete cascade,
  kind text not null,
  recipient text not null,
  provider_id text,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create table public.ticket_checkin_audit (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references public.ticket_attendees(id) on delete cascade,
  action text not null check (action in ('check_in', 'undo')),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.ticket_rate_limits (
  key_hash text primary key,
  attempts integer not null default 1,
  window_started_at timestamptz not null default now()
);

create trigger ticket_events_set_updated_at before update on public.ticket_events
  for each row execute function public.set_updated_at();
create trigger ticket_reservations_set_updated_at before update on public.ticket_reservations
  for each row execute function public.set_updated_at();
create trigger ticket_attendees_set_updated_at before update on public.ticket_attendees
  for each row execute function public.set_updated_at();

create or replace function public.enforce_ticket_event_capacity()
returns trigger language plpgsql set search_path = public as $$
declare confirmed_count integer;
begin
  if new.capacity is null then return new; end if;
  select count(*)::integer into confirmed_count
  from public.ticket_attendees a
  join public.ticket_reservations r on r.id = a.reservation_id
  where a.event_id = new.id and r.status = 'confirmed' and a.status <> 'cancelled';
  if new.capacity < confirmed_count then
    raise exception 'ticket_capacity_below_confirmed';
  end if;
  return new;
end;
$$;

create trigger ticket_events_enforce_capacity before update of capacity on public.ticket_events
  for each row execute function public.enforce_ticket_event_capacity();

create or replace function public.promote_ticket_waitlist(p_event_id uuid)
returns uuid[] language plpgsql security definer set search_path = public as $$
declare
  event_capacity integer;
  confirmed_count integer;
  available integer;
  candidate record;
  promoted uuid[] := '{}';
begin
  select capacity into event_capacity from public.ticket_events where id = p_event_id for update;
  if event_capacity is null then return promoted; end if;
  loop
    select count(*)::integer into confirmed_count
    from public.ticket_attendees a
    join public.ticket_reservations r on r.id = a.reservation_id
    where a.event_id = p_event_id and r.status = 'confirmed' and a.status <> 'cancelled';
    available := event_capacity - confirmed_count;
    exit when available <= 0;

    select r.id, count(a.id)::integer as active_size into candidate
    from public.ticket_reservations r
    join public.ticket_attendees a on a.reservation_id = r.id and a.status <> 'cancelled'
    where r.event_id = p_event_id and r.status = 'waitlisted'
    group by r.id, r.created_at
    having count(a.id) <= available
    order by r.created_at asc
    limit 1;
    exit when candidate.id is null;

    update public.ticket_reservations
      set status = 'confirmed', party_size = candidate.active_size
      where id = candidate.id;
    promoted := array_append(promoted, candidate.id);
  end loop;
  return promoted;
end;
$$;

create or replace function public.create_ticket_reservation(
  p_event_slug text,
  p_contact_first_name text,
  p_contact_last_name text,
  p_contact_email text,
  p_contact_phone text,
  p_management_token_hash text,
  p_idempotency_key text,
  p_rate_key_hash text,
  p_attendees jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  event_row public.ticket_events%rowtype;
  attendee_count integer;
  confirmed_count integer;
  reservation_status public.ticket_reservation_status;
  reservation_id uuid;
  reservation_reference text;
  item jsonb;
  existing jsonb;
  rate_row public.ticket_rate_limits%rowtype;
begin
  if p_attendees is null or jsonb_typeof(p_attendees) <> 'array' then
    raise exception 'ticket_invalid_attendees';
  end if;
  attendee_count := jsonb_array_length(p_attendees);
  if attendee_count < 1 or attendee_count > 4 then raise exception 'ticket_party_size'; end if;

  select * into event_row from public.ticket_events where slug = p_event_slug for update;
  if event_row.id is null then raise exception 'ticket_event_not_found'; end if;
  if event_row.capacity is null then raise exception 'ticket_capacity_unconfigured'; end if;
  if not event_row.booking_enabled
    or (event_row.booking_opens_at is not null and now() < event_row.booking_opens_at)
    or (event_row.booking_closes_at is not null and now() >= event_row.booking_closes_at)
  then raise exception 'ticket_booking_closed'; end if;

  select jsonb_build_object('id', id, 'reference', reference, 'status', status)
    into existing from public.ticket_reservations
    where event_id = event_row.id and idempotency_key = p_idempotency_key;
  if existing is not null then return existing; end if;

  select * into rate_row from public.ticket_rate_limits where key_hash = p_rate_key_hash for update;
  if rate_row.key_hash is null then
    insert into public.ticket_rate_limits(key_hash) values (p_rate_key_hash);
  elsif rate_row.window_started_at > now() - interval '15 minutes' and rate_row.attempts >= 5 then
    raise exception 'ticket_rate_limited';
  elsif rate_row.window_started_at <= now() - interval '15 minutes' then
    update public.ticket_rate_limits set attempts = 1, window_started_at = now() where key_hash = p_rate_key_hash;
  else
    update public.ticket_rate_limits set attempts = attempts + 1 where key_hash = p_rate_key_hash;
  end if;

  for item in select value from jsonb_array_elements(p_attendees) loop
    if length(trim(item->>'first_name')) < 2 or length(trim(item->>'last_name')) < 2
      or position('@' in (item->>'email')) < 2 or coalesce(item->>'ticket_token_hash', '') = ''
    then raise exception 'ticket_invalid_attendee'; end if;
    if exists (
      select 1 from public.ticket_attendees
      where event_id = event_row.id and status <> 'cancelled'
        and lower(trim(email)) = lower(trim(item->>'email'))
    ) then raise exception 'ticket_duplicate_email'; end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_attendees) value
    group by lower(trim(value->>'email')) having count(*) > 1
  ) then raise exception 'ticket_duplicate_email'; end if;

  select count(*)::integer into confirmed_count
  from public.ticket_attendees a join public.ticket_reservations r on r.id = a.reservation_id
  where a.event_id = event_row.id and r.status = 'confirmed' and a.status <> 'cancelled';
  reservation_status := case when confirmed_count + attendee_count <= event_row.capacity
    then 'confirmed'::public.ticket_reservation_status else 'waitlisted'::public.ticket_reservation_status end;
  reservation_reference := 'VIC26-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.ticket_reservations(
    event_id, reference, contact_first_name, contact_last_name, contact_email, contact_phone,
    party_size, status, management_token_hash, idempotency_key
  ) values (
    event_row.id, reservation_reference, trim(p_contact_first_name), trim(p_contact_last_name),
    lower(trim(p_contact_email)), trim(p_contact_phone), attendee_count, reservation_status,
    p_management_token_hash, p_idempotency_key
  ) returning id into reservation_id;

  for item in select value from jsonb_array_elements(p_attendees) loop
    insert into public.ticket_attendees(
      event_id, reservation_id, position, first_name, last_name, email, ticket_token_hash
    ) values (
      event_row.id, reservation_id, (item->>'position')::smallint, trim(item->>'first_name'),
      trim(item->>'last_name'), lower(trim(item->>'email')), item->>'ticket_token_hash'
    );
  end loop;

  return jsonb_build_object('id', reservation_id, 'reference', reservation_reference, 'status', reservation_status);
end;
$$;

create or replace function public.update_ticket_reservation(
  p_management_token_hash text,
  p_contact_first_name text,
  p_contact_last_name text,
  p_contact_email text,
  p_contact_phone text,
  p_attendees jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  reservation_row public.ticket_reservations%rowtype;
  item jsonb;
  keep_ids uuid[] := '{}';
  attendee_id uuid;
  active_count integer;
  promoted uuid[];
begin
  select * into reservation_row from public.ticket_reservations
    where management_token_hash = p_management_token_hash for update;
  if reservation_row.id is null then raise exception 'ticket_invalid_management_token'; end if;
  if reservation_row.status = 'cancelled' then raise exception 'ticket_reservation_cancelled'; end if;
  if exists (select 1 from public.ticket_attendees where reservation_id = reservation_row.id and status = 'checked_in')
    then raise exception 'ticket_checked_in_locked'; end if;
  if jsonb_array_length(p_attendees) > reservation_row.party_size then raise exception 'ticket_cannot_add_attendee'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_attendees) value
    group by lower(trim(value->>'email')) having count(*) > 1
  ) then raise exception 'ticket_duplicate_email'; end if;

  for item in select value from jsonb_array_elements(p_attendees) loop
    attendee_id := (item->>'id')::uuid;
    if not exists (select 1 from public.ticket_attendees where id = attendee_id and reservation_id = reservation_row.id and status <> 'cancelled')
      then raise exception 'ticket_invalid_attendee'; end if;
    if exists (
      select 1 from public.ticket_attendees
      where event_id = reservation_row.event_id and id <> attendee_id and status <> 'cancelled'
        and lower(trim(email)) = lower(trim(item->>'email'))
    ) then raise exception 'ticket_duplicate_email'; end if;
    update public.ticket_attendees set
      first_name = trim(item->>'first_name'), last_name = trim(item->>'last_name'),
      email = lower(trim(item->>'email')), ticket_token_hash = item->>'ticket_token_hash',
      status = case when status = 'checked_in' then 'checked_in'::public.ticket_attendee_status else 'active'::public.ticket_attendee_status end
      where id = attendee_id;
    keep_ids := array_append(keep_ids, attendee_id);
  end loop;

  update public.ticket_attendees set status = 'cancelled', cancelled_at = now()
    where reservation_id = reservation_row.id and status <> 'cancelled' and not (id = any(keep_ids));
  select count(*)::integer into active_count from public.ticket_attendees
    where reservation_id = reservation_row.id and status <> 'cancelled';
  update public.ticket_reservations set
    contact_first_name = trim(p_contact_first_name), contact_last_name = trim(p_contact_last_name),
    contact_email = lower(trim(p_contact_email)), contact_phone = trim(p_contact_phone),
    party_size = case when active_count = 0 then party_size else active_count end,
    status = case when active_count = 0 then 'cancelled'::public.ticket_reservation_status else status end,
    cancelled_at = case when active_count = 0 then now() else null end
    where id = reservation_row.id;

  promoted := public.promote_ticket_waitlist(reservation_row.event_id);
  return jsonb_build_object('active_count', active_count, 'promoted_ids', promoted);
end;
$$;

create or replace function public.check_in_ticket(p_ticket_token_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare attendee_row record;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'ticket_admin_required'; end if;
  select a.*, r.reference, r.status as reservation_status, e.name as event_name
    into attendee_row from public.ticket_attendees a
    join public.ticket_reservations r on r.id = a.reservation_id
    join public.ticket_events e on e.id = a.event_id
    where a.ticket_token_hash = p_ticket_token_hash for update;
  if attendee_row.id is null then return jsonb_build_object('result', 'invalid'); end if;
  if attendee_row.status = 'cancelled' or attendee_row.reservation_status <> 'confirmed' then
    return jsonb_build_object('result', 'inactive');
  end if;
  if attendee_row.status = 'checked_in' then
    return jsonb_build_object('result', 'already_checked_in', 'first_name', attendee_row.first_name,
      'last_name', attendee_row.last_name, 'checked_in_at', attendee_row.checked_in_at);
  end if;
  update public.ticket_attendees set status = 'checked_in', checked_in_at = now(), checked_in_by = auth.uid()
    where id = attendee_row.id;
  insert into public.ticket_checkin_audit(attendee_id, action, admin_user_id)
    values (attendee_row.id, 'check_in', auth.uid());
  return jsonb_build_object('result', 'checked_in', 'attendee_id', attendee_row.id,
    'first_name', attendee_row.first_name, 'last_name', attendee_row.last_name, 'reference', attendee_row.reference);
end;
$$;

create or replace function public.undo_ticket_check_in(p_attendee_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'ticket_admin_required'; end if;
  update public.ticket_attendees set status = 'active', checked_in_at = null, checked_in_by = null
    where id = p_attendee_id and status = 'checked_in';
  if found then insert into public.ticket_checkin_audit(attendee_id, action, admin_user_id)
    values (p_attendee_id, 'undo', auth.uid()); end if;
end;
$$;

alter table public.ticket_events enable row level security;
alter table public.ticket_reservations enable row level security;
alter table public.ticket_attendees enable row level security;
alter table public.ticket_email_log enable row level security;
alter table public.ticket_checkin_audit enable row level security;
alter table public.ticket_rate_limits enable row level security;

create policy "Admins manage ticket events" on public.ticket_events for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage ticket reservations" on public.ticket_reservations for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage ticket attendees" on public.ticket_attendees for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins read ticket email logs" on public.ticket_email_log for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins read ticket checkin audit" on public.ticket_checkin_audit for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

grant select, insert, update, delete on public.ticket_events, public.ticket_reservations,
  public.ticket_attendees, public.ticket_email_log, public.ticket_checkin_audit to authenticated;
grant all on public.ticket_events, public.ticket_reservations, public.ticket_attendees,
  public.ticket_email_log, public.ticket_checkin_audit, public.ticket_rate_limits to service_role;
grant execute on function public.check_in_ticket(text), public.undo_ticket_check_in(uuid) to authenticated;
revoke all on public.ticket_rate_limits from anon, authenticated;
revoke execute on function public.create_ticket_reservation(text,text,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.update_ticket_reservation(text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.promote_ticket_waitlist(uuid) from public, anon, authenticated;
grant execute on function public.create_ticket_reservation(text,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function public.update_ticket_reservation(text,text,text,text,text,jsonb) to service_role;
grant execute on function public.promote_ticket_waitlist(uuid) to service_role;

insert into public.ticket_events(slug, name, starts_at, venue, city, capacity, booking_enabled)
values ('victorious-2026', 'Victorious — La Nuit de l''Excellence', '2026-07-25T19:00:00+02:00', 'ICC Rouen', 'Isneauville', null, false)
on conflict (slug) do nothing;
