import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { Upload, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signMany } from "@/lib/storage-urls";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/gallery")({
  component: AdminGallery,
});

type GalleryRow = {
  id: string;
  image_url: string;
  alt: string;
  caption: string | null;
  type: string;
  aspect: string;
  sort_order: number;
  published: boolean;
};

function AdminGallery() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GalleryRow[];
    },
  });

  useEffect(() => {
    if (!items) return;
    void signMany("gallery", items.map((i) => i.image_url), 3600, {
      width: 500,
      quality: 70,
      resize: "cover",
    }).then(setUrls);
  }, [items]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const maxOrder = items?.reduce((m, c) => Math.max(m, c.sort_order), 0) ?? 0;
      let order = maxOrder;
      for (const file of Array.from(files)) {
        order += 1;
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(path, file, { upsert: false });
        if (upErr) continue;
        await supabase.from("gallery_items").insert({
          image_url: path,
          alt: file.name.replace(/\.[^.]+$/, ""),
          caption: null,
          type: "photo",
          aspect: "square",
          sort_order: order,
          published: true,
        });
      }
      e.target.value = "";
      qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    } finally {
      setUploading(false);
    }
  };

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<GalleryRow> }) => {
      const { error } = await supabase.from("gallery_items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gallery"] }),
  });

  const remove = useMutation({
    mutationFn: async (item: GalleryRow) => {
      await supabase.storage.from("gallery").remove([item.image_url]);
      const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gallery"] }),
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
        supabase.from("gallery_items").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("gallery_items").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "gallery"] }),
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory">Galerie</h1>
          <p className="mt-2 text-sm text-ivory/60">
            Téléversez des photos, modifiez les légendes, réordonnez ou masquez.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 border border-champagne/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-champagne hover:text-obsidian">
          <Upload className="size-4" />
          {uploading ? "Envoi…" : "Ajouter des photos"}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            className="sr-only"
          />
        </label>
      </header>

      {isLoading ? (
        <div className="text-sm text-ivory/50">Chargement…</div>
      ) : !items?.length ? (
        <div className="border border-champagne/15 p-12 text-center text-sm text-ivory/50">
          Aucune photo pour l'instant. Téléversez votre première image.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article key={item.id} className="border border-champagne/15">
              <div className="relative aspect-[4/3] overflow-hidden bg-velvet">
                {urls[item.image_url] ? (
                  <img
                    src={urls[item.image_url]}
                    alt={item.alt}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-xs text-ivory/40">…</div>
                )}
                <div className="absolute right-2 top-2 flex flex-col gap-1">
                  <button
                    onClick={() => move.mutate({ id: item.id, direction: "up" })}
                    disabled={i === 0}
                    className="grid size-7 place-items-center bg-obsidian/80 text-champagne hover:bg-champagne hover:text-obsidian disabled:opacity-30"
                    aria-label="Monter"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move.mutate({ id: item.id, direction: "down" })}
                    disabled={i === items.length - 1}
                    className="grid size-7 place-items-center bg-obsidian/80 text-champagne hover:bg-champagne hover:text-obsidian disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <input
                  type="text"
                  defaultValue={item.caption ?? ""}
                  placeholder="Légende"
                  onBlur={(e) => {
                    if (e.target.value !== (item.caption ?? "")) {
                      update.mutate({ id: item.id, patch: { caption: e.target.value || null } });
                    }
                  }}
                  className="w-full border border-champagne/20 bg-transparent p-2 text-xs text-ivory focus:border-champagne"
                />
                <div className="flex gap-2">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      update.mutate({ id: item.id, patch: { type: e.target.value } })
                    }
                    className="flex-1 border border-champagne/20 bg-obsidian p-1.5 text-xs text-ivory"
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Vidéo</option>
                    <option value="replay">Replay</option>
                  </select>
                  <select
                    value={item.aspect}
                    onChange={(e) =>
                      update.mutate({ id: item.id, patch: { aspect: e.target.value } })
                    }
                    className="flex-1 border border-champagne/20 bg-obsidian p-1.5 text-xs text-ivory"
                  >
                    <option value="square">Carré</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Paysage</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      update.mutate({ id: item.id, patch: { published: !item.published } })
                    }
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em]",
                      item.published
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-ivory/10 text-ivory/50",
                    )}
                  >
                    {item.published ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                    {item.published ? "Publiée" : "Masquée"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer cette photo ?")) remove.mutate(item);
                    }}
                    className="text-ivory/50 hover:text-red-300"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
