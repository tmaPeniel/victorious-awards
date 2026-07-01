export type ParsedVideo =
  | { kind: "youtube"; id: string; embedUrl: string; thumbnailUrl: string }
  | { kind: "vimeo"; id: string; embedUrl: string; thumbnailUrl: null }
  | { kind: "file"; url: string; embedUrl: string; thumbnailUrl: null }
  | null;

export function parseVideoUrl(raw: string | null | undefined): ParsedVideo {
  if (!raw) return null;
  const url = raw.trim();
  if (!url) return null;

  // YouTube
  const yt =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) {
    const id = yt[1];
    return {
      kind: "youtube",
      id,
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    const id = vm[1];
    return {
      kind: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
      thumbnailUrl: null,
    };
  }

  // Assume direct file URL (mp4/webm) — public
  return { kind: "file", url, embedUrl: url, thumbnailUrl: null };
}
