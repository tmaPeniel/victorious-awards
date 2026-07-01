
CREATE POLICY "Public can view testimonials files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'testimonials');

CREATE POLICY "Admins can upload testimonials files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update testimonials files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonials files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials' AND public.has_role(auth.uid(), 'admin'));
