import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();

export async function signUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const key = `${bucket}:${path}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now + 60_000) return cached.url;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (!data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, expires: now + expiresIn * 1000 });
  return data.signedUrl;
}

export async function signMany(
  bucket: string,
  paths: (string | null | undefined)[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    paths.filter(Boolean).map(async (p) => {
      const url = await signUrl(bucket, p, expiresIn);
      if (url && p) out[p] = url;
    }),
  );
  return out;
}
