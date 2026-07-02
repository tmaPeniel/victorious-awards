import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { signMany, signUrl } from "@/lib/storage-urls";

export type TestimonialRow = {
  id: string;
  type: "written" | "video";
  winner_name: string;
  category_slug: string | null;
  edition_year: number;
  quote: string;
  full_story: string | null;
  photo_url: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  sort_order: number;
  published: boolean;
};

async function resolve(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return signUrl("testimonials", path);
}

export function useTestimonials() {
  const query = useQuery({
    queryKey: ["public", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("edition_year", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TestimonialRow[];
    },
  });

  const [items, setItems] = useState<TestimonialRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const rows = query.data ?? [];
    (async () => {
      const paths = rows.flatMap((r) => [r.photo_url, r.video_thumbnail_url]);
      const signed = await signMany("testimonials", paths);
      const resolveField = (v: string | null) => {
        if (!v) return null;
        if (/^https?:\/\//.test(v)) return v;
        return signed[v] ?? null;
      };
      const next = await Promise.all(
        rows.map(async (r) => ({
          ...r,
          photo_url: resolveField(r.photo_url),
          video_thumbnail_url: resolveField(r.video_thumbnail_url),
          video_url:
            r.video_url && !/^https?:\/\//.test(r.video_url)
              ? await resolve(r.video_url)
              : r.video_url,
        })),
      );
      if (!cancelled) setItems(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [query.data]);

  return { ...query, items };
}

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TestimonialRow[];
    },
  });
}

export function useSignedTestimonialUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//.test(path)) {
      setUrl(path);
      return;
    }
    signUrl("testimonials", path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
}
