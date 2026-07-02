import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Play, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTestimonials, useSignedTestimonialUrl, type TestimonialRow } from "@/lib/use-testimonials";
import { parseVideoUrl } from "@/lib/parse-video-url";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonials,
});

type FormState = {
  id?: string;
  type: "written" | "video";
  winner_name: string;
  category_slug: string;
  edition_year: number;
  quote: string;
  full_story: string;
  video_url: string;
  photo_path: string | null;
  video_thumbnail_path: string | null;
  published: boolean;
};

const emptyForm = (): FormState => ({
  type: "written",
  winner_name: "",
  category_slug: "",
  edition_year: new Date().getFullYear(),
  quote: "",
  full_story: "",
  video_url: "",
  photo_path: null,
  video_thumbnail_path: null,
  published: true,
});

async function uploadTo(bucket: "testimonials", file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) {
    alert(`Upload échoué: ${error.message}`);
    return null;
  }
  return path;
}

function AdminTestimonials() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useAdminTestimonials();
  const [editing, setEditing] = useState<FormState | null>(null);

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        type: f.type,
        winner_name: f.winner_name,
        category_slug: f.category_slug || null,
        edition_year: f.edition_year,
        quote: f.quote,
        full_story: f.type === "written" ? f.full_story || null : null,
        video_url: f.type === "video" ? f.video_url || null : null,
        photo_url: f.photo_path,
        video_thumbnail_url: f.video_thumbnail_path,
        published: f.published,
      };
      if (f.id) {
        const { error } = await supabase.from("testimonials").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const maxOrder = items?.reduce((m, c) => Math.max(m, c.sort_order), 0) ?? 0;
        const { error } = await supabase
          .from("testimonials")
          .insert({ ...payload, sort_order: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["public", "testimonials"] });
      setEditing(null);
    },
    onError: (e: Error) => alert(`Erreur : ${e.message}`),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TestimonialRow> }) => {
      const { error } = await supabase.from("testimonials").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["public", "testimonials"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (t: TestimonialRow) => {
      const paths = [t.photo_url, t.video_thumbnail_url].filter(
        (p): p is string => !!p && !/^https?:\/\//.test(p),
      );
      if (paths.length) await supabase.storage.from("testimonials").remove(paths);
      const { error } = await supabase.from("testimonials").delete().eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      qc.invalidateQueries({ queryKey: ["public", "testimonials"] });
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!items) return;
      const idx = items.findIndex((c) => c.id === id);
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= items.length) return;
      const a = items[idx];
      const b = items[swap];
      await Promise.all([
        supabase.from("testimonials").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("testimonials").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "testimonials"] }),
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory">Témoignages</h1>
          <p className="mt-2 text-sm text-ivory/60">
            Ajoutez, modifiez et publiez les témoignages des précédents lauréats.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(emptyForm())}
          className="inline-flex items-center gap-2 bg-champagne px-4 py-2 text-xs uppercase tracking-[0.2em] text-obsidian hover:bg-gold"
        >
          <Plus className="size-4" />
          Nouveau témoignage
        </button>
      </header>

      {isLoading ? (
        <div className="text-sm text-ivory/50">Chargement…</div>
      ) : !items?.length ? (
        <div className="border border-champagne/15 p-12 text-center text-sm text-ivory/50">
          Aucun témoignage pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t, i) => {
            const parsed = parseVideoUrl(t.video_url);
            return (
              <article
                key={t.id}
                className="grid grid-cols-[80px_1fr_auto] items-center gap-4 border border-champagne/15 bg-obsidian/50 p-3"
              >
                <div className="relative aspect-square overflow-hidden bg-velvet">
                  {t.photo_url ? (
                    <SignedThumb path={t.photo_url} />
                  ) : parsed?.kind === "youtube" ? (
                    <img src={parsed.thumbnailUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-champagne/40">
                      {t.type === "video" ? <Play className="size-5" /> : "•"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-champagne/70">
                    <span
                      className={cn(
                        "px-2 py-0.5",
                        t.type === "video"
                          ? "bg-gold/15 text-gold"
                          : "bg-champagne/15 text-champagne",
                      )}
                    >
                      {t.type === "video" ? "Vidéo" : "Écrit"}
                    </span>
                    <span>Édition {t.edition_year}</span>
                    {t.category_slug && <span>· {t.category_slug}</span>}
                  </div>
                  <div className="mt-1 truncate font-display text-lg text-ivory">
                    {t.winner_name}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-ivory/50">
                    {t.quote}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move.mutate({ id: t.id, direction: "up" })}
                    disabled={i === 0}
                    className="grid size-8 place-items-center text-champagne/70 hover:text-champagne disabled:opacity-30"
                    aria-label="Monter"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move.mutate({ id: t.id, direction: "down" })}
                    disabled={i === items.length - 1}
                    className="grid size-8 place-items-center text-champagne/70 hover:text-champagne disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    onClick={() =>
                      update.mutate({ id: t.id, patch: { published: !t.published } })
                    }
                    className={cn(
                      "grid size-8 place-items-center",
                      t.published ? "text-emerald-300" : "text-ivory/40",
                    )}
                    aria-label={t.published ? "Masquer" : "Publier"}
                  >
                    {t.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    onClick={() =>
                      setEditing({
                        id: t.id,
                        type: t.type,
                        winner_name: t.winner_name,
                        category_slug: t.category_slug ?? "",
                        edition_year: t.edition_year,
                        quote: t.quote,
                        full_story: t.full_story ?? "",
                        video_url: t.video_url ?? "",
                        photo_path: t.photo_url,
                        video_thumbnail_path: t.video_thumbnail_url,
                        published: t.published,
                      })
                    }
                    className="grid size-8 place-items-center text-champagne/70 hover:text-champagne"
                    aria-label="Modifier"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer ce témoignage ?")) remove.mutate(t);
                    }}
                    className="grid size-8 place-items-center text-ivory/50 hover:text-red-300"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <EditModal
          value={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function EditModal({
  value,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  value: FormState;
  onChange: (v: FormState) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [uploading, setUploading] = useState<"photo" | "thumb" | null>(null);

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    field: "photo_path" | "video_thumbnail_path",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field === "photo_path" ? "photo" : "thumb");
    const path = await uploadTo("testimonials", file);
    setUploading(null);
    if (path) onChange({ ...value, [field]: path });
    e.target.value = "";
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.winner_name.trim()) {
      alert("Le nom du lauréat est requis.");
      return;
    }
    if (value.type === "video" && !value.video_url.trim()) {
      alert("Une URL vidéo (YouTube, Vimeo ou mp4) est requise.");
      return;
    }
    if (value.type === "written" && !value.quote.trim()) {
      alert("La citation est requise pour un témoignage écrit.");
      return;
    }
    onSave();
  };

  const photoUrl = testimonialsPublicUrl(value.photo_path);
  const thumbUrl = testimonialsPublicUrl(value.video_thumbnail_path);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-obsidian/95 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-velvet p-8"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fermer"
          className="absolute right-4 top-4 grid size-9 place-items-center text-champagne hover:text-gold"
        >
          <X className="size-5" />
        </button>
        <h2 className="font-display text-2xl text-ivory">
          {value.id ? "Modifier" : "Nouveau témoignage"}
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              Type
            </label>
            <div className="mt-2 flex gap-2">
              {(["written", "video"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...value, type: t })}
                  className={cn(
                    "flex-1 border py-2 text-xs uppercase tracking-[0.2em]",
                    value.type === t
                      ? "border-champagne bg-champagne text-obsidian"
                      : "border-champagne/30 text-champagne",
                  )}
                >
                  {t === "written" ? "Écrit" : "Vidéo"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nom du lauréat"
              value={value.winner_name}
              onChange={(v) => onChange({ ...value, winner_name: v })}
              required
            />
            <Field
              label="Année d'édition"
              type="number"
              value={String(value.edition_year)}
              onChange={(v) => onChange({ ...value, edition_year: Number(v) || value.edition_year })}
              required
            />
          </div>
          <Field
            label="Slug de catégorie (optionnel)"
            value={value.category_slug}
            onChange={(v) => onChange({ ...value, category_slug: v })}
          />

          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              Citation
            </label>
            <textarea
              value={value.quote}
              onChange={(e) => onChange({ ...value, quote: e.target.value })}
              rows={3}
              className="mt-2 w-full border border-champagne/25 bg-obsidian p-3 text-sm text-ivory focus:border-champagne focus:outline-none"
              placeholder="Une phrase forte, ce que Dieu a fait…"
            />
          </div>

          {value.type === "written" && (
            <div>
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
                Témoignage complet (optionnel)
              </label>
              <textarea
                value={value.full_story}
                onChange={(e) => onChange({ ...value, full_story: e.target.value })}
                rows={6}
                className="mt-2 w-full border border-champagne/25 bg-obsidian p-3 text-sm text-ivory focus:border-champagne focus:outline-none"
              />
            </div>
          )}

          {value.type === "video" && (
            <Field
              label="URL vidéo (YouTube, Vimeo ou mp4)"
              value={value.video_url}
              onChange={(v) => onChange({ ...value, video_url: v })}
              placeholder="https://youtu.be/..."
              required
            />
          )}

          {/* Photo upload */}
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              {value.type === "written" ? "Portrait" : "Miniature (fallback si pas YouTube)"}
            </label>
            <div className="mt-2 flex items-center gap-4">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="size-20 object-cover" />
              ) : (
                <div className="grid size-20 place-items-center bg-obsidian text-xs text-ivory/40">
                  —
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 border border-champagne/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-champagne hover:text-obsidian">
                {uploading === "photo" ? "Envoi…" : "Choisir un fichier"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleUpload(e, "photo_path")}
                />
              </label>
              {value.photo_path && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, photo_path: null })}
                  className="text-xs text-ivory/50 hover:text-red-300"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          {value.type === "video" && (
            <div>
              <label className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
                Miniature vidéo personnalisée (optionnel)
              </label>
              <div className="mt-2 flex items-center gap-4">
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" className="h-20 w-32 object-cover" />
                ) : (
                  <div className="grid h-20 w-32 place-items-center bg-obsidian text-xs text-ivory/40">
                    —
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 border border-champagne/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-champagne hover:text-obsidian">
                  {uploading === "thumb" ? "Envoi…" : "Choisir"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleUpload(e, "video_thumbnail_path")}
                  />
                </label>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 text-sm text-ivory">
            <input
              type="checkbox"
              checked={value.published}
              onChange={(e) => onChange({ ...value, published: e.target.checked })}
              className="size-4 accent-champagne"
            />
            Publié sur le site
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="border border-champagne/30 px-5 py-2 text-xs uppercase tracking-[0.2em] text-champagne"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-champagne px-6 py-2 text-xs uppercase tracking-[0.2em] text-obsidian hover:bg-gold disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border border-champagne/25 bg-obsidian p-2.5 text-sm text-ivory focus:border-champagne focus:outline-none"
      />
    </div>
  );
}
