alter table public.ticket_attendees
  add column if not exists ticket_version integer not null default 1
  check (ticket_version > 0);

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
      ticket_version = greatest(1, (item->>'ticket_version')::integer),
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

revoke execute on function public.update_ticket_reservation(text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.update_ticket_reservation(text,text,text,text,text,jsonb)
  to service_role;
