
-- Backfill: insert rows for storage files not yet in gallery_items
INSERT INTO public.gallery_items (image_url, alt, caption, type, aspect, sort_order, published)
SELECT
  o.name,
  regexp_replace(split_part(o.name, '/', -1), '\.[^.]+$', ''),
  CASE WHEN o.name ~ '^\d{4}/' THEN 'Édition ' || split_part(o.name, '/', 1) ELSE NULL END,
  'photo',
  'landscape',
  COALESCE((SELECT MAX(sort_order) FROM public.gallery_items), 0)
    + ROW_NUMBER() OVER (ORDER BY o.created_at),
  true
FROM storage.objects o
WHERE o.bucket_id = 'gallery'
  AND NOT EXISTS (SELECT 1 FROM public.gallery_items gi WHERE gi.image_url = o.name);

-- Auto-sync on INSERT: new storage file → new gallery_items row
CREATE OR REPLACE FUNCTION public.handle_gallery_object_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.bucket_id = 'gallery' THEN
    INSERT INTO public.gallery_items (image_url, alt, caption, type, aspect, sort_order, published)
    VALUES (
      NEW.name,
      regexp_replace(split_part(NEW.name, '/', -1), '\.[^.]+$', ''),
      CASE WHEN NEW.name ~ '^\d{4}/' THEN 'Édition ' || split_part(NEW.name, '/', 1) ELSE NULL END,
      'photo',
      'landscape',
      COALESCE((SELECT MAX(sort_order) FROM public.gallery_items), 0) + 1,
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_gallery_object_insert ON storage.objects;
CREATE TRIGGER on_gallery_object_insert
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.handle_gallery_object_insert();
