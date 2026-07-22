-- Decommission the ticketing feature without deleting historical reservations.
update public.ticket_events
set booking_enabled = false;

revoke all on function public.get_ticketing_availability(text)
  from public, anon, authenticated, service_role;
revoke all on function public.create_ticket_reservation(text, text, text, text, text, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.create_ticket_reservation(text, text, text, text, text, text, text, text, jsonb, text)
  from public, anon, authenticated, service_role;
revoke all on function public.update_ticket_reservation(text, text, text, text, text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.check_in_ticket(text)
  from public, anon, authenticated, service_role;
revoke all on function public.undo_ticket_check_in(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.promote_ticket_waitlist(uuid)
  from public, anon, authenticated, service_role;
