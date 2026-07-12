import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Filter, X } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
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

  const cities = Array.from(
    new Set(data?.map((application) => application.city).filter(Boolean) ?? []),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const filtered = data?.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (cityFilter !== "all" && a.city !== cityFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      a.first_name.toLowerCase().includes(s) ||
      a.last_name.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s) ||
      a.city.toLowerCase().includes(s)
    );
  });

  const activeFilterCount =
    Number(statusFilter !== "all") + Number(cityFilter !== "all");

  const resetFilters = () => {
    setStatusFilter("all");
    setCityFilter("all");
  };

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

      <div className="relative flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className={cn(
            "inline-flex h-10 items-center gap-2 border px-4 text-xs uppercase tracking-[0.2em] transition-colors",
            filtersOpen || activeFilterCount > 0
              ? "border-champagne bg-champagne/10 text-champagne"
              : "border-champagne/20 text-ivory/60 hover:border-champagne/50",
          )}
        >
          <Filter className="size-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-champagne text-[0.65rem] text-obsidian">
              {activeFilterCount}
            </span>
          )}
        </button>
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-10 min-w-0 flex-1 border border-champagne/20 bg-transparent px-3 text-sm text-ivory outline-none focus:border-champagne sm:max-w-xs"
        />

        {filtersOpen && (
          <div className="w-full border border-champagne/15 bg-obsidian p-5 shadow-elegant">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xs uppercase tracking-[0.25em] text-champagne/70">
                Filtrer les candidatures
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Fermer les filtres"
                className="grid size-8 place-items-center text-ivory/50 hover:text-champagne"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-ivory/50">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
                  className="mt-2 h-10 w-full border border-champagne/20 bg-obsidian px-3 text-sm text-ivory outline-none focus:border-champagne"
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[0.65rem] uppercase tracking-[0.2em] text-ivory/50">
                  Ville
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="mt-2 h-10 w-full border border-champagne/20 bg-obsidian px-3 text-sm text-ivory outline-none focus:border-champagne"
                >
                  <option value="all">Toutes les villes</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 text-xs uppercase tracking-[0.2em] text-champagne hover:text-ivory"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>


      <div className="overflow-x-auto border border-champagne/15">
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
                <th className="px-5 py-3 font-normal">Ville</th>
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
                  <td className="whitespace-nowrap px-5 py-4 text-ivory/70">
                    {a.city}
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
