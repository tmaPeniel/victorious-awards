import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signMany } from "@/lib/storage-urls";

export type GalleryDBItem = {
  id: string;
  src: string;
  alt: string;
  caption: string | null;
  type: "photo" | "video" | "replay";
  aspect: "portrait" | "landscape" | "square";
  imagePath: string;
};


export function useGallery() {
  const [urls, setUrls] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ["public", "gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!query.data) return;
    void signMany(
      "gallery",
      query.data.map((g) => g.image_url),
    ).then(setUrls);
  }, [query.data]);

  const items: GalleryDBItem[] =
    query.data?.map((g) => ({
      id: g.id,
      src: urls[g.image_url] ?? "",
      alt: g.alt,
      caption: g.caption,
      type: (g.type as GalleryDBItem["type"]) ?? "photo",
      aspect: (g.aspect as GalleryDBItem["aspect"]) ?? "square",
      imagePath: g.image_url,
    })) ?? [];


  return { ...query, items };
}
