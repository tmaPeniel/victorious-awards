create type public.raffle_participant_status as enum ('active', 'cancelled');

create sequence public.raffle_ticket_number_seq start 1;

create table public.raffle_participants (
  id uuid primary key default gen_random_uuid(),
  ticket_number integer not null default nextval('public.raffle_ticket_number_seq'),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  status public.raffle_participant_status not null default 'active',
  ticket_token_hash text not null unique,
  whatsapp_sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ticket_number)
);

create index raffle_participants_status_idx
  on public.raffle_participants (status, created_at);

create trigger raffle_participants_set_updated_at before update on public.raffle_participants
  for each row execute function public.set_updated_at();

alter table public.raffle_participants enable row level security;

create policy "Admins manage raffle participants" on public.raffle_participants for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

grant select, insert, update, delete on public.raffle_participants to authenticated;
grant all on public.raffle_participants to service_role;
grant usage, select on sequence public.raffle_ticket_number_seq to authenticated, service_role;
