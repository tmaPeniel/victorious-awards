import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { event as eventDetails } from "@/content/event";
import type { Json } from "@/integrations/supabase/types";

const whatsappSchema = z
  .string()
  .transform((v) => {
    let s = v.replace(/[\s\-().]/g, "");
    if (s.startsWith("00")) s = "+" + s.slice(2);
    if (/^0\d{9}$/.test(s)) s = "+33" + s.slice(1);
    return s;
  })
  .pipe(
    z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/, "Numéro WhatsApp invalide (format international, ex. +33612345678)."),
  );


const attendeeSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(255),
  whatsapp: z.union([whatsappSchema, z.literal("")]).optional(),
});

const bookingSchema = z.object({
  contactFirstName: z.string().trim().min(2).max(60),
  contactLastName: z.string().trim().min(2).max(60),
  contactEmail: z.string().trim().email().max(255),
  contactPhone: z.string().trim().max(24),
  contactWhatsapp: whatsappSchema,
  attendees: z
    .array(attendeeSchema.omit({ id: true }))
    .min(1)
    .max(4),
  rgpd: z.literal(true),
  idempotencyKey: z.string().uuid(),
  website: z.string().max(0),
});

const manageSchema = z.object({
  token: z.string().min(32),
  contactFirstName: z.string().trim().min(2).max(60),
  contactLastName: z.string().trim().min(2).max(60),
  contactEmail: z.string().trim().email().max(255),
  contactPhone: z.string().trim().min(8).max(24),
  attendees: z.array(attendeeSchema.extend({ id: z.string().uuid() })).max(4),
});


const tokenSchema = z.object({ token: z.string().min(32) });

type AdminAuth = { accessToken: string };

export type TicketBundle = {
  reference: string;
  status: "confirmed" | "waitlisted" | "cancelled";
  contactFirstName: string;
  contactLastName: string;
  contactWhatsapp: string | null;
  event: {
    name: string;
    startsAt: string;
    venue: string;
    city: string;
  };
  tickets: Array<{
    attendeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string | null;
    token: string;
  }>;
};


async function hashToken(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
}

async function deterministicToken(seed: string): Promise<string> {
  return hashToken(`victorious-ticket:v1:${seed}`);
}

function ticketSeed(idempotencyKey: string, position: number, version: number): string {
  const base = `${idempotencyKey}:attendee:${position}`;
  return version === 1 ? base : `${base}:v${version}`;
}

async function ticketToken(idempotencyKey: string, position: number, version: number) {
  return deterministicToken(ticketSeed(idempotencyKey, position, version));
}

async function buildTicketBundle(reservationId: string): Promise<TicketBundle> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: reservation, error } = await supabaseAdmin
    .from("ticket_reservations")
    .select(
      "id, event_id, reference, status, idempotency_key, contact_first_name, contact_last_name, contact_whatsapp",
    )
    .eq("id", reservationId)
    .single();
  if (error || !reservation) throw new Error("Réservation introuvable.");

  const [{ data: event }, { data: attendees }] = await Promise.all([
    supabaseAdmin
      .from("ticket_events")
      .select("name, starts_at, venue, city")
      .eq("id", reservation.event_id)
      .single(),
    supabaseAdmin
      .from("ticket_attendees")
      .select(
        "id, position, first_name, last_name, email, whatsapp, status, ticket_token_hash, ticket_version",
      )
      .eq("reservation_id", reservation.id)
      .neq("status", "cancelled")
      .order("position"),
  ]);
  if (!event) throw new Error("Événement introuvable.");

  const tickets =
    reservation.status === "confirmed"
      ? await Promise.all(
          (attendees ?? []).map(async (attendee) => {
            const token = await ticketToken(
              reservation.idempotency_key,
              attendee.position,
              attendee.ticket_version,
            );
            const tokenHash = await hashToken(token);
            if (tokenHash !== attendee.ticket_token_hash) {
              const { error: updateError } = await supabaseAdmin
                .from("ticket_attendees")
                .update({ ticket_token_hash: tokenHash })
                .eq("id", attendee.id);
              if (updateError) throw updateError;
            }
            return {
              attendeeId: attendee.id,
              firstName: attendee.first_name,
              lastName: attendee.last_name,
              email: attendee.email,
              whatsapp: attendee.whatsapp ?? null,
              token,
            };
          }),
        )
      : [];

  return {
    reference: reservation.reference,
    status: reservation.status,
    contactFirstName: reservation.contact_first_name,
    contactLastName: reservation.contact_last_name,
    contactWhatsapp: reservation.contact_whatsapp ?? null,
    event: {
      name: event.name,
      startsAt: event.starts_at,
      venue: event.venue,
      city: event.city,
    },
    tickets,
  };
}


function translateTicketError(message: string): string {
  const errors: Record<string, string> = {
    ticket_capacity_unconfigured: "La billetterie n’est pas encore configurée.",
    ticket_booking_closed: "Les inscriptions sont actuellement fermées.",
    ticket_party_size: "Une réservation doit contenir entre 1 et 4 participants.",
    ticket_duplicate_email:
      "Une des adresses e-mail possède déjà un billet actif pour cet événement.",
    ticket_rate_limited: "Trop de tentatives ont été effectuées. Réessayez dans 15 minutes.",
    ticket_invalid_management_token: "Ce lien de gestion n’est pas valide.",
    ticket_reservation_cancelled: "Cette réservation a déjà été annulée.",
    ticket_cannot_add_attendee: "Vous ne pouvez pas ajouter de place après la réservation.",
    ticket_checked_in_locked:
      "Cette réservation ne peut plus être modifiée après le contrôle d’un billet.",
  };
  if (message.includes("ticket_attendees_active_email_idx")) return errors.ticket_duplicate_email;
  const key = Object.keys(errors).find((item) => message.includes(item));
  return key ? errors[key] : "La réservation n’a pas pu être enregistrée. Merci de réessayer.";
}

export const getTicketingAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { createAuthenticatedSupabaseClient, createPublicSupabaseClient } =
    await import("@/integrations/supabase/client.server");
  const { getRequest } = await import("@tanstack/react-start/server");
  const authHeader = getRequest().headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!accessToken) {
    const { data, error } = await createPublicSupabaseClient().rpc("get_ticketing_availability", {
      p_event_slug: "victorious-2026",
    });
    if (error || !data)
      return { state: "unconfigured" as const, event: null, confirmed: 0, remaining: 0 };
    return data as unknown as {
      state: "unconfigured" | "open" | "closed";
      event: {
        name: string;
        startsAt: string;
        venue: string;
        city: string;
        capacity: number | null;
      } | null;
      confirmed: number;
      remaining: number;
    };
  }

  const supabase = createAuthenticatedSupabaseClient(accessToken);
  const { data: event, error } = await supabase
    .from("ticket_events")
    .select("*")
    .eq("slug", "victorious-2026")
    .single();
  if (error || !event)
    return { state: "unconfigured" as const, event: null, confirmed: 0, remaining: 0 };

  const { count } = await supabase
    .from("ticket_attendees")
    .select("id, ticket_reservations!inner(status)", { count: "exact", head: true })
    .eq("event_id", event.id)
    .neq("status", "cancelled")
    .eq("ticket_reservations.status", "confirmed");
  const confirmed = count ?? 0;
  const remaining = Math.max(0, (event.capacity ?? 0) - confirmed);
  const now = Date.now();
  const isOpen =
    event.booking_enabled &&
    event.capacity != null &&
    (!event.booking_opens_at || new Date(event.booking_opens_at).getTime() <= now) &&
    (!event.booking_closes_at || new Date(event.booking_closes_at).getTime() > now);
  return {
    state:
      event.capacity == null
        ? ("unconfigured" as const)
        : isOpen
          ? ("open" as const)
          : ("closed" as const),
    event: {
      name: event.name,
      startsAt: event.starts_at,
      venue: event.venue,
      city: event.city,
      capacity: event.capacity,
    },
    confirmed,
    remaining,
  };
});

export const createTicketReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.website)
      return {
        ok: true as const,
        reference: "",
        status: "waitlisted" as const,
        managementPath: "",
        ticketBundle: null,
      };
    const { createAuthenticatedSupabaseClient, createPublicSupabaseClient } =
      await import("@/integrations/supabase/client.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const authHeader = getRequest().headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const supabase = accessToken
      ? createAuthenticatedSupabaseClient(accessToken)
      : createPublicSupabaseClient();
    const managementToken = await deterministicToken(`${data.idempotencyKey}:management`);
    const rawTicketTokens = await Promise.all(
      data.attendees.map((_, index) =>
        deterministicToken(`${data.idempotencyKey}:attendee:${index + 1}`),
      ),
    );
    const attendeePayload = await Promise.all(
      data.attendees.map(async (attendee, index) => ({
        position: index + 1,
        first_name: attendee.firstName,
        last_name: attendee.lastName,
        email: attendee.email.toLowerCase(),
        whatsapp: attendee.whatsapp?.trim() ? attendee.whatsapp.trim() : null,
        ticket_token_hash: await hashToken(rawTicketTokens[index]),
      })),
    );

    const rpcPayload = {
      p_event_slug: "victorious-2026",
      p_contact_first_name: data.contactFirstName,
      p_contact_last_name: data.contactLastName,
      p_contact_email: data.contactEmail.toLowerCase(),
      p_contact_phone: data.contactPhone,
      p_contact_whatsapp: data.contactWhatsapp,
      p_management_token_hash: await hashToken(managementToken),
      p_idempotency_key: data.idempotencyKey,
      p_rate_key_hash: await hashToken(data.contactEmail.toLowerCase()),
      p_attendees: attendeePayload as Json,
    };

    let { data: result, error } = await supabase.rpc("create_ticket_reservation", rpcPayload);
    if (error && accessToken && error.message.toLowerCase().includes("permission denied")) {
      const { data: ticketEvent } = await supabase
        .from("ticket_events")
        .select("id, capacity, booking_enabled, booking_opens_at, booking_closes_at")
        .eq("slug", "victorious-2026")
        .single();
      if (!ticketEvent?.capacity)
        throw new Error(translateTicketError("ticket_capacity_unconfigured"));
      const now = Date.now();
      if (
        !ticketEvent.booking_enabled ||
        (ticketEvent.booking_opens_at && new Date(ticketEvent.booking_opens_at).getTime() > now) ||
        (ticketEvent.booking_closes_at && new Date(ticketEvent.booking_closes_at).getTime() <= now)
      )
        throw new Error(translateTicketError("ticket_booking_closed"));

      const { count } = await supabase
        .from("ticket_attendees")
        .select("id, ticket_reservations!inner(status)", { count: "exact", head: true })
        .eq("event_id", ticketEvent.id)
        .neq("status", "cancelled")
        .eq("ticket_reservations.status", "confirmed");
      const status =
        (count ?? 0) + data.attendees.length <= ticketEvent.capacity
          ? ("confirmed" as const)
          : ("waitlisted" as const);
      const reference = `VIC26-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
      const { data: reservation, error: reservationError } = await supabase
        .from("ticket_reservations")
        .insert({
          event_id: ticketEvent.id,
          reference,
          contact_first_name: data.contactFirstName,
          contact_last_name: data.contactLastName,
          contact_email: data.contactEmail.toLowerCase(),
          contact_phone: data.contactPhone,
          contact_whatsapp: data.contactWhatsapp,
          party_size: data.attendees.length,
          status,
          management_token_hash: rpcPayload.p_management_token_hash,
          idempotency_key: data.idempotencyKey,
        })
        .select("id, reference, status")
        .single();
      if (reservationError || !reservation)
        throw reservationError ?? new Error("Réservation introuvable.");
      const { error: attendeesError } = await supabase.from("ticket_attendees").insert(
        attendeePayload.map((attendee) => ({
          ...attendee,
          event_id: ticketEvent.id,
          reservation_id: reservation.id,
        })),
      );
      if (attendeesError) throw attendeesError;
      result = reservation;
      error = null;
    }
    if (error) throw new Error(translateTicketError(error.message));
    const booking = result as { id: string; reference: string; status: "confirmed" | "waitlisted" };
    const ticketBundle: TicketBundle = {
      reference: booking.reference,
      status: booking.status,
      contactFirstName: data.contactFirstName,
      contactLastName: data.contactLastName,
      contactWhatsapp: data.contactWhatsapp,
      event: {
        name: `${eventDetails.name} — ${eventDetails.theme}`,
        startsAt: eventDetails.date.toISOString(),
        venue: eventDetails.venue,
        city: eventDetails.city,
      },
      tickets:
        booking.status === "confirmed"
          ? data.attendees.map((attendee, index) => ({
              attendeeId: "",
              firstName: attendee.firstName,
              lastName: attendee.lastName,
              email: attendee.email,
              whatsapp: attendee.whatsapp?.trim() ? attendee.whatsapp.trim() : null,
              token: rawTicketTokens[index],
            }))
          : [],
    };
    return {
      ok: true as const,
      reference: booking.reference,
      status: booking.status,
      managementPath: `/billetterie/gerer?token=${managementToken}`,
      ticketBundle,
    };
  });


export const getTicketBundle = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reservation, error } = await supabaseAdmin
      .from("ticket_reservations")
      .select("id")
      .eq("management_token_hash", await hashToken(data.token))
      .single();
    if (error || !reservation) throw new Error("Ce lien de gestion n’est pas valide.");
    return buildTicketBundle(reservation.id);
  });

export const getManagedReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reservation, error } = await supabaseAdmin
      .from("ticket_reservations")
      .select(
        "id, reference, status, contact_first_name, contact_last_name, contact_email, contact_phone",
      )
      .eq("management_token_hash", await hashToken(data.token))
      .single();
    if (error || !reservation) throw new Error("Ce lien de gestion n’est pas valide.");
    const { data: attendees } = await supabaseAdmin
      .from("ticket_attendees")
      .select("id, first_name, last_name, email, status, checked_in_at")
      .eq("reservation_id", reservation.id)
      .neq("status", "cancelled")
      .order("position");
    return { reservation, attendees: attendees ?? [] };
  });

export const updateManagedReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => manageSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const managementHash = await hashToken(data.token);
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("ticket_reservations")
      .select("id, idempotency_key")
      .eq("management_token_hash", managementHash)
      .single();
    if (reservationError || !reservation) throw new Error("Ce lien de gestion n’est pas valide.");
    const { data: currentAttendees, error: attendeesError } = await supabaseAdmin
      .from("ticket_attendees")
      .select("id, position, first_name, last_name, email, ticket_version")
      .eq("reservation_id", reservation.id)
      .neq("status", "cancelled");
    if (attendeesError) throw attendeesError;

    const attendeesPayload = await Promise.all(
      data.attendees.map(async (attendee) => {
        const current = currentAttendees?.find((item) => item.id === attendee.id);
        if (!current) throw new Error("Un participant n’est plus actif dans cette réservation.");
        const changed =
          current.first_name.trim() !== attendee.firstName.trim() ||
          current.last_name.trim() !== attendee.lastName.trim() ||
          current.email.trim().toLowerCase() !== attendee.email.trim().toLowerCase();
        const version = current.ticket_version + (changed ? 1 : 0);
        const token = await ticketToken(reservation.idempotency_key, current.position, version);
        return {
          id: attendee.id,
          first_name: attendee.firstName,
          last_name: attendee.lastName,
          email: attendee.email.toLowerCase(),
          ticket_token_hash: await hashToken(token),
          ticket_version: version,
        };
      }),
    );
    const { data: result, error } = await supabaseAdmin.rpc("update_ticket_reservation", {
      p_management_token_hash: managementHash,
      p_contact_first_name: data.contactFirstName,
      p_contact_last_name: data.contactLastName,
      p_contact_email: data.contactEmail.toLowerCase(),
      p_contact_phone: data.contactPhone,
      p_attendees: attendeesPayload as Json,
    });
    if (error) throw new Error(translateTicketError(error.message));
    const promotedIds = ((result as { promoted_ids?: string[] })?.promoted_ids ?? []) as string[];
    return {
      ok: true as const,
      cancelled: data.attendees.length === 0,
      promoted: promotedIds.length,
    };

  });

export const getTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attendee, error } = await supabaseAdmin
      .from("ticket_attendees")
      .select(
        "id, first_name, last_name, email, status, checked_in_at, ticket_reservations!inner(reference,status), ticket_events!inner(name,starts_at,venue,city)",
      )
      .eq("ticket_token_hash", await hashToken(data.token))
      .single();
    if (error || !attendee) throw new Error("Ce billet n’est pas valide.");
    return attendee;
  });

async function requireAdmin(accessToken: string) {
  const { createAuthenticatedSupabaseClient } =
    await import("@/integrations/supabase/client.server");
  const supabase = createAuthenticatedSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Session administrateur invalide.");
  const { data: role } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Accès administrateur requis.");
  return { user: data.user, supabase };
}

export const adminUpdateReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        reservationId: z.string().uuid(),
        accessToken: z.string().min(20),
        contactFirstName: z.string().trim().min(2).max(60),
        contactLastName: z.string().trim().min(2).max(60),
        contactEmail: z.string().trim().email().max(255),
        contactPhone: z.string().trim().min(8).max(24),
        attendees: z.array(
          z.object({
            id: z.string().uuid(),
            firstName: z.string().trim().min(2).max(60),
            lastName: z.string().trim().min(2).max(60),
            email: z.string().trim().email().max(255),
          }),
        ),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("ticket_reservations")
      .select("id, idempotency_key, management_token_hash, status")
      .eq("id", data.reservationId)
      .single();
    if (reservationError || !reservation) throw new Error("Réservation introuvable.");
    if (reservation.status === "cancelled") throw new Error("Cette réservation est annulée.");

    const { data: currentAttendees, error: attendeesError } = await supabaseAdmin
      .from("ticket_attendees")
      .select("id, position, first_name, last_name, email, ticket_version")
      .eq("reservation_id", reservation.id)
      .neq("status", "cancelled");
    if (attendeesError) throw attendeesError;
    if (data.attendees.length !== (currentAttendees?.length ?? 0))
      throw new Error("Le nombre de participants actifs a changé. Rechargez la page.");

    const normalizedEmails = data.attendees.map((attendee) => attendee.email.trim().toLowerCase());
    if (new Set(normalizedEmails).size !== normalizedEmails.length)
      throw new Error("Chaque participant doit utiliser une adresse e-mail différente.");

    const attendeesPayload = await Promise.all(
      data.attendees.map(async (attendee) => {
        const current = currentAttendees?.find((item) => item.id === attendee.id);
        if (!current) throw new Error("Participant introuvable.");
        const changed =
          current.first_name.trim() !== attendee.firstName.trim() ||
          current.last_name.trim() !== attendee.lastName.trim() ||
          current.email.trim().toLowerCase() !== attendee.email.trim().toLowerCase();
        const version = current.ticket_version + (changed ? 1 : 0);
        const token = await ticketToken(reservation.idempotency_key, current.position, version);
        return {
          id: attendee.id,
          first_name: attendee.firstName,
          last_name: attendee.lastName,
          email: attendee.email,
          ticket_version: version,
          ticket_token_hash: await hashToken(token),
        };
      }),
    );
    const { error } = await supabaseAdmin.rpc("update_ticket_reservation", {
      p_management_token_hash: reservation.management_token_hash,
      p_contact_first_name: data.contactFirstName,
      p_contact_last_name: data.contactLastName,
      p_contact_email: data.contactEmail,
      p_contact_phone: data.contactPhone,
      p_attendees: attendeesPayload as Json,
    });
    if (error) throw new Error(translateTicketError(error.message));
    return { ok: true as const };
  });

export const adminCancelReservation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ reservationId: z.string().uuid(), accessToken: z.string().min(20) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reservation } = await supabaseAdmin
      .from("ticket_reservations")
      .select("event_id")
      .eq("id", data.reservationId)
      .single();
    if (!reservation) throw new Error("Réservation introuvable.");
    await supabaseAdmin
      .from("ticket_attendees")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("reservation_id", data.reservationId)
      .neq("status", "cancelled");
    await supabaseAdmin
      .from("ticket_reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", data.reservationId);
    const { data: promoted } = await supabaseAdmin.rpc("promote_ticket_waitlist", {
      p_event_id: reservation.event_id,
    });
    const promotedIds = (promoted ?? []) as string[];
    return { ok: true as const, promoted: promotedIds.length };
  });

export const adminGetReservationBundle = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ reservationId: z.string().uuid(), accessToken: z.string().min(20) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const bundle = await buildTicketBundle(data.reservationId);
    return { ok: true as const, bundle };
  });


export const updateTicketEventSettings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        accessToken: z.string().min(20),
        eventId: z.string().uuid(),
        capacity: z.number().int().positive().nullable(),
        bookingEnabled: z.boolean(),
        bookingOpensAt: z.string().datetime().nullable(),
        bookingClosesAt: z.string().datetime().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabase } = await requireAdmin(data.accessToken);
    const { error } = await supabase
      .from("ticket_events")
      .update({
        capacity: data.capacity,
        booking_enabled: data.bookingEnabled,
        booking_opens_at: data.bookingOpensAt,
        booking_closes_at: data.bookingClosesAt,
      })
      .eq("id", data.eventId);
    if (error)
      throw new Error(
        error.message.includes("ticket_capacity_below_confirmed")
          ? "La jauge ne peut pas être inférieure au nombre de places confirmées."
          : error.message,
      );
    return { ok: true as const, promoted: 0 };
  });

export type { AdminAuth };
