import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

function publicUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const { data } = supabase.storage.from("testimonials").getPublicUrl(path);
  return data.publicUrl;
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

  const items = (query.data ?? []).map((t) => ({
    ...t,
    photo_url: publicUrl(t.photo_url),
    video_thumbnail_url: publicUrl(t.video_thumbnail_url),
    video_url:
      t.video_url && !/^https?:\/\//.test(t.video_url)
        ? publicUrl(t.video_url)
        : t.video_url,
  }));

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

export { publicUrl as testimonialsPublicUrl };
