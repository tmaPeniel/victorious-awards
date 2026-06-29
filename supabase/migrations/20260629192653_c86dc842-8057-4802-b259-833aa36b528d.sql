
-- 1. Cleanup orphans: rows pointing to files no longer in storage
DELETE FROM public.gallery_items gi
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects o
  WHERE o.bucket_id = 'gallery' AND o.name = gi.image_url
);

-- 2. Auto-sync trigger: when a gallery storage object is deleted, drop its row
CREATE OR REPLACE FUNCTION public.handle_gallery_object_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.bucket_id = 'gallery' THEN
    DELETE FROM public.gallery_items WHERE image_url = OLD.name;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_gallery_object_delete ON storage.objects;
CREATE TRIGGER on_gallery_object_delete
AFTER DELETE ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.handle_gallery_object_delete();
