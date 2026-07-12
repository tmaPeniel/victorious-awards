import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/content/categories";
import { VButton } from "@/components/victorious/VButton";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["application_status"];

const STATUSES: Status[] = [
  "pending",
  "reviewing",
  "shortlisted",
  "winner",
  "rejected",
];

export const Route = createFileRoute("/admin/applications/$id")({
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { id } = useParams({ from: "/admin/applications/$id" });
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("pending");
  const [signed, setSigned] = useState<{ photo?: string }>({});

  const { data: app, isLoading } = useQuery({
    queryKey: ["admin", "application", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!app) return;
    setNotes(app.admin_notes ?? "");
    setStatus(app.status);
    void (async () => {
      const result: { photo?: string } = {};
      if (app.photo_path) {
        const { data } = await supabase.storage
          .from("application-files")
          .createSignedUrl(app.photo_path, 3600);
        if (data) result.photo = data.signedUrl;
      }
      setSigned(result);
    })();
  }, [app]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("applications")
        .update({ status, admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      window.location.href = "/admin/applications";
    },
  });

  if (isLoading || !app) {
    return <div className="text-sm text-ivory/50">Chargement…</div>;
  }

  const category = categories.find((c) => c.slug === app.category_slug);

  return (
    <div className="space-y-8">
      <Link
        to="/admin/applications"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-ivory/60 hover:text-champagne"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>

      <header className="border-b border-champagne/15 pb-6">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
          {category?.title ?? app.category_slug}
        </div>
        <h1 className="mt-3 font-display text-4xl text-ivory">
          {app.first_name} {app.last_name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ivory/60">
          <a href={`mailto:${app.email}`} className="hover:text-champagne">
            {app.email}
          </a>
          <a href={`tel:${app.phone}`} className="hover:text-champagne">
            {app.phone}
          </a>
          <span className="text-ivory/50">•</span>
          <span>{app.city}</span>
          <span>
            Reçue le{" "}
            {new Date(app.created_at).toLocaleString("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </span>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
          Témoignage
        </h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-ivory/80">
          {app.testimony}
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <FileBlock label="Photo" url={signed.photo} />
      </section>

      <section className="space-y-4 border border-champagne/15 p-6">
        <h2 className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
          Décision
        </h2>
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-ivory/60">
            Statut
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="mt-2 w-full border border-champagne/20 bg-obsidian px-3 py-2 text-sm text-ivory focus:border-champagne"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-ivory/60">
            Notes internes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="mt-2 w-full border border-champagne/20 bg-transparent p-3 text-sm text-ivory focus:border-champagne"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              if (confirm("Supprimer définitivement cette candidature ?")) {
                remove.mutate();
              }
            }}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-300 hover:text-red-200"
          >
            <Trash2 className="size-4" /> Supprimer
          </button>
          <VButton
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </VButton>
        </div>
        {save.isSuccess && (
          <p className="text-xs text-emerald-300">Modifications enregistrées.</p>
        )}
      </section>
    </div>
  );
}

function FileBlock({ label, url }: { label: string; url?: string }) {
  return (
    <div className="border border-champagne/15 p-5">
      <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
        {label}
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-champagne hover:text-ivory"
        >
          <Download className="size-4" /> Ouvrir le fichier
        </a>
      ) : (
        <p className="mt-3 text-sm text-ivory/40">Aucun fichier fourni.</p>
      )}
    </div>
  );
}
