import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signMany } from "@/lib/storage-urls";

export type GalleryDBItem = {
  id: string;
  src: string;
  srcSet?: string;
  fullSrc: string;
  alt: string;
  caption: string | null;
  type: "photo" | "video" | "replay";
  aspect: "portrait" | "landscape" | "square";
  imagePath: string;
};


export function useGallery() {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [thumbs2x, setThumbs2x] = useState<Record<string, string>>({});
  const [fulls, setFulls] = useState<Record<string, string>>({});

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
    const paths = query.data.map((g) => g.image_url);
    void signMany("gallery", paths, 3600, { width: 600, quality: 70, resize: "cover" }).then(setThumbs);
    void signMany("gallery", paths, 3600, { width: 1200, quality: 70, resize: "cover" }).then(setThumbs2x);
    void signMany("gallery", paths, 3600, { width: 1920, quality: 82 }).then(setFulls);
  }, [query.data]);

  const items: GalleryDBItem[] =
    query.data?.map((g) => {
      const thumb = thumbs[g.image_url] ?? "";
      const thumb2x = thumbs2x[g.image_url];
      return {
        id: g.id,
        src: thumb,
        srcSet: thumb && thumb2x ? `${thumb} 1x, ${thumb2x} 2x` : undefined,
        fullSrc: fulls[g.image_url] ?? thumb2x ?? thumb,
        alt: g.alt,
        caption: g.caption,
        type: (g.type as GalleryDBItem["type"]) ?? "photo",
        aspect: (g.aspect as GalleryDBItem["aspect"]) ?? "square",
        imagePath: g.image_url,
      };
    }) ?? [];


  return { ...query, items };
}
