import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/content/categories";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { session } = useSession();
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["admin", "app_settings", "applications_open"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings" as never)
        .select("value")
        .eq("key", "applications_open")
        .maybeSingle();
      return (data as { value: unknown } | null)?.value === true;
    },
  });
  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("app_settings" as never)
        .upsert({ key: "applications_open", value: next, updated_at: new Date().toISOString() } as never, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "app_settings"] });
      void qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
  });
  const open = settings.data === true;
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [
        { count: total },
        { count: pending },
        { count: accepted },
        { count: rejected },
        { data: latest },
        { count: ticketed },
      ] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "winner"),
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected"),
        supabase
          .from("applications")
          .select("id, civility, first_name, last_name, category_slug, created_at, status")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("ticket_attendees")
          .select("id, ticket_reservations!inner(status)", { count: "exact", head: true })
          .neq("status", "cancelled")
          .eq("ticket_reservations.status", "confirmed"),
      ]);
      return {
        total: total ?? 0,
        pending: pending ?? 0,
        accepted: accepted ?? 0,
        rejected: rejected ?? 0,
        latest: latest ?? [],
        ticketed: ticketed ?? 0,
      };
    },
  });

  const stats = [
    { label: "Candidatures", value: data?.total ?? "—" },
    { label: "À traiter", value: data?.pending ?? "—" },
    { label: "Acceptées", value: data?.accepted ?? "—" },
    { label: "Rejetées", value: data?.rejected ?? "—" },
    { label: "Catégories", value: categories.length },
    { label: "Places réservées", value: data?.ticketed ?? "—" },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl text-ivory">Tableau de bord</h1>
        <p className="mt-2 text-sm text-ivory/60">Vue d'ensemble de l'édition en cours.</p>
      </header>

      <section className="flex flex-col gap-4 border border-champagne/15 bg-ivory/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">Candidatures</div>
          <div className="mt-2 font-display text-xl text-ivory">
            {settings.isLoading ? "…" : open ? "Ouvertes au public" : "Fermées au public"}
          </div>
          <p className="mt-1 text-xs text-ivory/50">
            Active ou désactive le formulaire de candidature sans redéploiement.
          </p>
        </div>
        <button
          type="button"
          disabled={settings.isLoading || toggle.isPending}
          onClick={() => toggle.mutate(!open)}
          className={cn(
            "inline-flex items-center gap-3 border px-5 py-3 text-[0.7rem] uppercase tracking-[0.3em] transition",
            open
              ? "border-champagne/40 text-champagne hover:bg-champagne/10"
              : "border-champagne bg-champagne text-obsidian hover:bg-champagne/90",
            (settings.isLoading || toggle.isPending) && "opacity-60",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              open ? "bg-champagne" : "bg-obsidian",
            )}
          />
          {toggle.isPending ? "Enregistrement…" : open ? "Fermer les candidatures" : "Ouvrir les candidatures"}
        </button>
      </section>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-champagne/15 bg-ivory/[0.02] p-6">
            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              {s.label}
            </div>
            <div className="mt-3 font-display text-4xl text-ivory">{isLoading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ivory">Dernières candidatures</h2>
          <Link
            to="/admin/applications"
            className="text-xs uppercase tracking-[0.25em] text-champagne hover:text-ivory"
          >
            Tout voir →
          </Link>
        </div>
        <div className="border border-champagne/15">
          {isLoading ? (
            <div className="p-6 text-sm text-ivory/50">Chargement…</div>
          ) : data?.latest.length === 0 ? (
            <div className="p-6 text-sm text-ivory/50">Aucune candidature pour le moment.</div>
          ) : (
            <ul className="divide-y divide-champagne/10">
              {data?.latest.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/admin/applications/$id"
                    params={{ id: a.id }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-ivory/5"
                  >
                    <div>
                      <div className="text-sm text-ivory">
                        {a.civility !== "Non renseignée" ? `${a.civility} ` : ""}
                        {a.first_name} {a.last_name}
                      </div>
                      <div className="text-xs text-ivory/50">
                        {categories.find((c) => c.slug === a.category_slug)?.title ??
                          a.category_slug}
                      </div>
                    </div>
                    <div className="text-[0.65rem] uppercase tracking-[0.25em] text-champagne/60">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
