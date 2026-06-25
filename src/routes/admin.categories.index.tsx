import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Eye, EyeOff, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/categories/")({
  component: AdminCategoriesList,
});

function AdminCategoriesList() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("categories")
        .update({ published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
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
        supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      if (!slug || !newTitle.trim()) throw new Error("Slug et titre requis");
      const maxOrder = items?.reduce((m, c) => Math.max(m, c.sort_order), 0) ?? 0;
      const { error } = await supabase.from("categories").insert({
        slug,
        title: newTitle.trim(),
        sort_order: maxOrder + 1,
        published: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCreating(false);
      setNewSlug("");
      setNewTitle("");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ivory">Catégories</h1>
          <p className="mt-2 text-sm text-ivory/60">
            Gérez le contenu, l'image et l'ordre des catégories du prix.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 border border-champagne/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-champagne hover:text-obsidian"
        >
          <Plus className="size-4" /> Nouvelle catégorie
        </button>
      </header>

      {creating && (
        <div className="space-y-3 border border-champagne/20 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Titre"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-10 border border-champagne/20 bg-transparent px-3 text-sm text-ivory focus:border-champagne"
            />
            <input
              type="text"
              placeholder="slug-url (lettres minuscules, tirets)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="h-10 border border-champagne/20 bg-transparent px-3 text-sm text-ivory focus:border-champagne"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => create.mutate()}
              disabled={create.isPending}
              className="border border-champagne bg-champagne/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-champagne"
            >
              Créer
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-ivory/60"
            >
              Annuler
            </button>
          </div>
          {create.error && (
            <p className="text-xs text-red-300">{(create.error as Error).message}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-ivory/50">Chargement…</div>
      ) : (
        <div className="border border-champagne/15">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-champagne/15 text-left text-[0.65rem] uppercase tracking-[0.25em] text-champagne/60">
                <th className="px-5 py-3 font-normal">#</th>
                <th className="px-5 py-3 font-normal">Titre</th>
                <th className="px-5 py-3 font-normal">Slug</th>
                <th className="px-5 py-3 font-normal">Publiée</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-champagne/10">
              {items?.map((c, i) => (
                <tr key={c.id} className="hover:bg-ivory/5">
                  <td className="px-5 py-4 text-ivory/40">
                    <div className="flex items-center gap-1">
                      {String(i + 1).padStart(2, "0")}
                      <div className="ml-2 flex flex-col">
                        <button
                          onClick={() => move.mutate({ id: c.id, direction: "up" })}
                          disabled={i === 0}
                          className="text-ivory/40 hover:text-champagne disabled:opacity-20"
                          aria-label="Monter"
                        >
                          <ChevronUp className="size-3" />
                        </button>
                        <button
                          onClick={() => move.mutate({ id: c.id, direction: "down" })}
                          disabled={i === (items?.length ?? 0) - 1}
                          className="text-ivory/40 hover:text-champagne disabled:opacity-20"
                          aria-label="Descendre"
                        >
                          <ChevronDown className="size-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-ivory">{c.title}</div>
                    <div className="text-xs text-ivory/40">{c.tagline}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ivory/50">{c.slug}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() =>
                        togglePublished.mutate({ id: c.id, published: !c.published })
                      }
                      className={cn(
                        "inline-flex items-center gap-2 px-2 py-1 text-[0.65rem] uppercase tracking-[0.2em]",
                        c.published
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-ivory/10 text-ivory/50",
                      )}
                    >
                      {c.published ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {c.published ? "Publiée" : "Brouillon"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/admin/categories/$slug"
                      params={{ slug: c.slug }}
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-champagne hover:text-ivory"
                    >
                      <Pencil className="size-3" /> Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
