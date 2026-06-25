import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signMany } from "@/lib/storage-urls";
import { categories as fallback, type Category } from "@/content/categories";

export type DBCategory = Category & { id: string; sort_order: number };

const fallbackImageBySlug = Object.fromEntries(
  fallback.map((c) => [c.slug, c.image]),
);

export function useCategories(opts?: { publishedOnly?: boolean }) {
  const publishedOnly = opts?.publishedOnly ?? true;
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ["public", "categories", publishedOnly],
    queryFn: async () => {
      let q = supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (publishedOnly) q = q.eq("published", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!query.data) return;
    const paths = query.data.map((c) => c.image_url).filter(Boolean) as string[];
    if (paths.length === 0) return;
    void signMany("category-images", paths).then(setImageUrls);
  }, [query.data]);

  const items: DBCategory[] =
    query.data?.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      tagline: c.tagline,
      description: c.description,
      criteria: c.criteria ?? [],
      documents: c.documents ?? [],
      sort_order: c.sort_order,
      image:
        (c.image_url ? imageUrls[c.image_url] : undefined) ??
        fallbackImageBySlug[c.slug] ??
        "",
    })) ?? [];

  return { ...query, items };
}

export function useCategory(slug: string) {
  const { items, isLoading, error } = useCategories({ publishedOnly: false });
  const cat = items.find((c) => c.slug === slug);
  return { cat, isLoading, error };
}
