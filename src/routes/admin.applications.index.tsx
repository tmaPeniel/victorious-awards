import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/content/categories";
import { cn } from "@/lib/utils";
import { exportApplicationsToExcel } from "@/lib/excel-export";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["application_status"];

const STATUSES: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "À traiter" },
  { value: "reviewing", label: "En revue" },
  { value: "shortlisted", label: "Présélectionnées" },
  { value: "winner", label: "Lauréates" },
  { value: "rejected", label: "Refusées" },
];

const statusColors: Record<Status, string> = {
  pending: "bg-champagne/15 text-champagne",
  reviewing: "bg-blue-500/15 text-blue-300",
  shortlisted: "bg-purple-500/15 text-purple-300",
  winner: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
};

export const Route = createFileRoute("/admin/applications/")({
  component: ApplicationsList,
});

function ApplicationsList() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications", filter],
    queryFn: async () => {
      let q = supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    if (!filtered?.length) return;
    setExporting(true);
    try {
      await exportApplicationsToExcel(filtered);
    } finally {
      setExporting(false);
    }
  };

  const filtered = data?.filter((a) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      a.first_name.toLowerCase().includes(s) ||
      a.last_name.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory">Candidatures</h1>
          <p className="mt-2 text-sm text-ivory/60">
            {data?.length ?? 0} dossier{(data?.length ?? 0) > 1 ? "s" : ""} reçu
            {(data?.length ?? 0) > 1 ? "s" : ""}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !filtered?.length}
          className="inline-flex items-center gap-2 border border-champagne/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-champagne transition-colors hover:bg-champagne hover:text-obsidian disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-4" />
          {exporting ? "Export…" : "Exporter Excel"}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={cn(
              "h-9 border px-4 text-xs uppercase tracking-[0.2em] transition-colors",
              filter === s.value
                ? "border-champagne bg-champagne/10 text-champagne"
                : "border-champagne/20 text-ivory/60 hover:border-champagne/50",
            )}
          >
            {s.label}
          </button>
        ))}
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 border border-champagne/20 bg-transparent px-3 text-sm text-ivory outline-none focus:border-champagne"
        />
      </div>


      <div className="border border-champagne/15">
        {isLoading ? (
          <div className="p-6 text-sm text-ivory/50">Chargement…</div>
        ) : filtered?.length === 0 ? (
          <div className="p-6 text-sm text-ivory/50">Aucun résultat.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-champagne/15 text-left text-[0.65rem] uppercase tracking-[0.25em] text-champagne/60">
                <th className="px-5 py-3 font-normal">Candidat</th>
                <th className="px-5 py-3 font-normal">Catégorie</th>
                <th className="px-5 py-3 font-normal">Reçue le</th>
                <th className="px-5 py-3 font-normal">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-champagne/10">
              {filtered?.map((a) => (
                <tr key={a.id} className="hover:bg-ivory/5">
                  <td className="px-5 py-4">
                    <div className="text-ivory">
                      {a.first_name} {a.last_name}
                    </div>
                    <div className="text-xs text-ivory/40">{a.email}</div>
                  </td>
                  <td className="px-5 py-4 text-ivory/70">
                    {categories.find((c) => c.slug === a.category_slug)?.title ??
                      a.category_slug}
                  </td>
                  <td className="px-5 py-4 text-ivory/60">
                    {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-block px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]",
                        statusColors[a.status],
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/admin/applications/$id"
                      params={{ id: a.id }}
                      className="text-xs uppercase tracking-[0.2em] text-champagne hover:text-ivory"
                    >
                      Ouvrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
