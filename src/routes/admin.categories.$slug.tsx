import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signUrl } from "@/lib/storage-urls";
import { VButton } from "@/components/victorious/VButton";

export const Route = createFileRoute("/admin/categories/$slug")({
  component: EditCategory,
});

function EditCategory() {
  const { slug } = useParams({ from: "/admin/categories/$slug" });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: cat, isLoading } = useQuery({
    queryKey: ["admin", "category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!cat) return;
    setTitle(cat.title);
    setTagline(cat.tagline);
    setDescription(cat.description);
    setCriteria(cat.criteria.length ? cat.criteria : [""]);
    setDocuments(cat.documents.length ? cat.documents : [""]);
    setPublished(cat.published);
    setImagePath(cat.image_url);
    if (cat.image_url) {
      void signUrl("category-images", cat.image_url).then(setImageUrl);
    }
  }, [cat]);

  const save = useMutation({
    mutationFn: async () => {
      if (!cat) return;
      const { error } = await supabase
        .from("categories")
        .update({
          title: title.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          criteria: criteria.map((c) => c.trim()).filter(Boolean),
          documents: documents.map((d) => d.trim()).filter(Boolean),
          published,
          image_url: imagePath,
        })
        .eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!cat) return;
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => navigate({ to: "/admin/categories" }),
  });

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cat) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${cat.slug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("category-images")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      setImagePath(path);
      const url = await signUrl("category-images", path);
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !cat) {
    return <div className="text-sm text-ivory/50">Chargement…</div>;
  }

  return (
    <div className="space-y-8">
      <Link
        to="/admin/categories"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-ivory/60 hover:text-champagne"
      >
        <ArrowLeft className="size-4" /> Retour
      </Link>

      <header className="border-b border-champagne/15 pb-6">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
          Catégorie · {cat.slug}
        </div>
        <h1 className="mt-3 font-display text-4xl text-ivory">{title || cat.title}</h1>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Field label="Titre">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-champagne/20 bg-transparent p-3 text-sm text-ivory focus:border-champagne"
            />
          </Field>
          <Field label="Accroche">
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full border border-champagne/20 bg-transparent p-3 text-sm text-ivory focus:border-champagne"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full border border-champagne/20 bg-transparent p-3 text-sm text-ivory focus:border-champagne"
            />
          </Field>

          <ListEditor label="Critères" values={criteria} onChange={setCriteria} />
          <ListEditor label="Pièces justificatives" values={documents} onChange={setDocuments} />
        </div>

        <aside className="space-y-6">
          <div className="border border-champagne/15 p-4">
            <div className="mb-3 text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
              Image
            </div>
            <div className="aspect-[4/5] w-full overflow-hidden bg-velvet">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-xs text-ivory/40">
                  Aucune image
                </div>
              )}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-champagne/40 px-3 py-2 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-champagne hover:text-obsidian">
              <Upload className="size-3" />
              {uploading ? "Envoi…" : "Remplacer"}
              <input type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
            </label>
          </div>

          <div className="border border-champagne/15 p-4">
            <label className="flex items-center gap-3 text-sm text-ivory">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="size-4 accent-champagne"
              />
              Publiée sur le site
            </label>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-champagne/15 pt-6">
        <button
          onClick={() => {
            if (confirm("Supprimer définitivement cette catégorie ?")) remove.mutate();
          }}
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-300 hover:text-red-200"
        >
          <Trash2 className="size-4" /> Supprimer
        </button>
        <VButton type="button" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </VButton>
      </div>
      {save.isSuccess && (
        <p className="text-xs text-emerald-300">Modifications enregistrées.</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[0.65rem] uppercase tracking-[0.3em] text-champagne/70">
        {label}
      </label>
      {children}
    </div>
  );
}

function ListEditor({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 border border-champagne/20 bg-transparent p-2 text-sm text-ivory focus:border-champagne"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="px-2 text-ivory/50 hover:text-red-300"
              aria-label="Supprimer"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="text-[0.65rem] uppercase tracking-[0.25em] text-champagne hover:text-ivory"
        >
          + Ajouter
        </button>
      </div>
    </Field>
  );
}
