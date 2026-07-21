import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const createSchema = z.object({
  accessToken: z.string().min(20),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  phone: whatsappSchema,
  email: z.string().trim().email().max(255),
});

const participantIdSchema = z.object({
  accessToken: z.string().min(20),
  participantId: z.string().uuid(),
});

async function hashToken(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
}

async function deterministicToken(seed: string): Promise<string> {
  return hashToken(`victorious-raffle:v1:${seed}`);
}

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

export const adminCreateRaffleParticipant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const { user } = await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = crypto.randomUUID();
    const token = await deterministicToken(id);
    const tokenHash = await hashToken(token);
    const { data: row, error } = await supabaseAdmin
      .from("raffle_participants")
      .insert({
        id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        email: data.email,
        ticket_token_hash: tokenHash,
        created_by: user.id,
      })
      .select("id, ticket_number")
      .single();
    if (error || !row) throw new Error("Impossible de créer le participant.");
    return { ok: true as const, id: row.id, ticketNumber: row.ticket_number, token };
  });

export const adminCancelRaffleParticipant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => participantIdSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("raffle_participants")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", data.participantId);
    if (error) throw new Error("Impossible d’annuler ce participant.");
    return { ok: true as const };
  });

export const adminDeleteRaffleParticipant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => participantIdSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("raffle_participants")
      .delete()
      .eq("id", data.participantId);
    if (error) throw new Error("Impossible de supprimer ce participant.");
    return { ok: true as const };
  });

export const adminMarkRaffleWhatsappSent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => participantIdSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin(data.accessToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("raffle_participants")
      .update({ whatsapp_sent_at: new Date().toISOString() })
      .eq("id", data.participantId);
    if (error) throw new Error("Impossible de mettre à jour le statut d’envoi.");
    return { ok: true as const };
  });
