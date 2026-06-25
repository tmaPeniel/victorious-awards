GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;