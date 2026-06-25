DROP POLICY IF EXISTS "Public can read published categories" ON public.categories;
CREATE POLICY "Public can read published categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (published = true);

DROP POLICY IF EXISTS "Public can read published gallery" ON public.gallery_items;
CREATE POLICY "Public can read published gallery" ON public.gallery_items
  FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "Admins can read all categories" ON public.categories
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read all gallery" ON public.gallery_items
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));