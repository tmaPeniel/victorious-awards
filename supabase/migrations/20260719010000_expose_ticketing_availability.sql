create or replace function public.get_ticketing_availability(p_event_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with selected_event as (
    select * from public.ticket_events where slug = p_event_slug limit 1
  ), confirmed_places as (
    select count(*)::integer as count
    from public.ticket_attendees attendee
    join public.ticket_reservations reservation on reservation.id = attendee.reservation_id
    join selected_event event on event.id = attendee.event_id
    where attendee.status <> 'cancelled' and reservation.status = 'confirmed'
  )
  select case
    when event.id is null then jsonb_build_object(
      'state', 'unconfigured', 'event', null, 'confirmed', 0, 'remaining', 0
    )
    else jsonb_build_object(
      'state', case
        when event.capacity is null then 'unconfigured'
        when event.booking_enabled
          and (event.booking_opens_at is null or now() >= event.booking_opens_at)
          and (event.booking_closes_at is null or now() < event.booking_closes_at)
          then 'open'
        else 'closed'
      end,
      'event', jsonb_build_object(
        'name', event.name,
        'startsAt', event.starts_at,
        'venue', event.venue,
        'city', event.city,
        'capacity', event.capacity
      ),
      'confirmed', coalesce(places.count, 0),
      'remaining', greatest(0, coalesce(event.capacity, 0) - coalesce(places.count, 0))
    )
  end
  from (select 1) seed
  left join selected_event event on true
  left join confirmed_places places on true;
$$;

revoke all on function public.get_ticketing_availability(text) from public;
grant execute on function public.get_ticketing_availability(text) to anon, authenticated;

grant execute on function public.create_ticket_reservation(
  text, text, text, text, text, text, text, text, jsonb
) to anon, authenticated;
