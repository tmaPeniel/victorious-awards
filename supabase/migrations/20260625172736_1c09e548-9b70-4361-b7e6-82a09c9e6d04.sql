
-- Public read on gallery + category-images, admin write
CREATE POLICY "Public read gallery objects" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins write gallery objects" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update gallery objects" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete gallery objects" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Public read category images" ON storage.objects
  FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Admins write category images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update category images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'category-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete category images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'category-images' AND public.has_role(auth.uid(),'admin'));
