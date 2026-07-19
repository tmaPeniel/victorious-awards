import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/content/categories";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [{ count: total }, { count: pending }, { data: latest }, { count: ticketed }] =
        await Promise.all([
          supabase.from("applications").select("id", { count: "exact", head: true }),
          supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("applications")
            .select("id, first_name, last_name, category_slug, created_at, status")
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
        latest: latest ?? [],
        ticketed: ticketed ?? 0,
      };
    },
  });

  const stats = [
    { label: "Candidatures", value: data?.total ?? "—" },
    { label: "À traiter", value: data?.pending ?? "—" },
    { label: "Catégories", value: categories.length },
    { label: "Places réservées", value: data?.ticketed ?? "—" },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl text-ivory">Tableau de bord</h1>
        <p className="mt-2 text-sm text-ivory/60">Vue d'ensemble de l'édition en cours.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
