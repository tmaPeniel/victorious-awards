-- Add WhatsApp fields for ticket delivery
ALTER TABLE public.ticket_reservations
  ADD COLUMN IF NOT EXISTS contact_whatsapp text;

ALTER TABLE public.ticket_attendees
  ADD COLUMN IF NOT EXISTS whatsapp text;

-- Extend create_ticket_reservation to accept the contact WhatsApp number and per-attendee WhatsApp
CREATE OR REPLACE FUNCTION public.create_ticket_reservation(
  p_event_slug text,
  p_contact_first_name text,
  p_contact_last_name text,
  p_contact_email text,
  p_contact_phone text,
  p_management_token_hash text,
  p_idempotency_key text,
  p_rate_key_hash text,
  p_attendees jsonb,
  p_contact_whatsapp text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    contact_whatsapp, party_size, status, management_token_hash, idempotency_key
  ) values (
    event_row.id, reservation_reference, trim(p_contact_first_name), trim(p_contact_last_name),
    lower(trim(p_contact_email)), trim(p_contact_phone),
    nullif(trim(coalesce(p_contact_whatsapp, '')), ''),
    attendee_count, reservation_status,
    p_management_token_hash, p_idempotency_key
  ) returning id into reservation_id;

  for item in select value from jsonb_array_elements(p_attendees) loop
    insert into public.ticket_attendees(
      event_id, reservation_id, position, first_name, last_name, email, whatsapp,
      ticket_token_hash, ticket_version
    ) values (
      event_row.id, reservation_id, (item->>'position')::smallint, trim(item->>'first_name'),
      trim(item->>'last_name'), lower(trim(item->>'email')),
      nullif(trim(coalesce(item->>'whatsapp', '')), ''),
      item->>'ticket_token_hash',
      coalesce((item->>'ticket_version')::smallint, 1)
    );
  end loop;

  return jsonb_build_object('id', reservation_id, 'reference', reservation_reference, 'status', reservation_status);
end;
$function$;
