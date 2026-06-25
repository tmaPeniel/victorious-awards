
-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  criteria text[] NOT NULL DEFAULT '{}',
  documents text[] NOT NULL DEFAULT '{}',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published categories" ON public.categories
  FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Gallery
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  caption text,
  type text NOT NULL DEFAULT 'photo' CHECK (type IN ('photo','video','replay')),
  aspect text NOT NULL DEFAULT 'square' CHECK (aspect IN ('portrait','landscape','square')),
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published gallery" ON public.gallery_items
  FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage gallery" ON public.gallery_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_gallery_updated_at BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed categories
INSERT INTO public.categories (slug, title, tagline, description, criteria, documents, sort_order) VALUES
('diplome-fin-de-cycle','Diplôme de fin de cycle','Le sceau d''un long chemin',
 'Pour celles et ceux qui viennent de clôturer un cycle d''études — du baccalauréat au doctorat. Une victoire qui se prépare dans la patience, l''effort et la foi.',
 ARRAY['Avoir obtenu son diplôme entre janvier 2025 et juin 2026','Être membre ou ami régulier d''ICC Rouen','Pouvoir partager une parole de reconnaissance'],
 ARRAY['Copie du diplôme ou attestation officielle','Photo récente'],1),
('premier-cdi','Premier CDI','La signature qui change tout',
 'La fin d''une attente, le début d''une stabilité. Cette catégorie honore le premier contrat à durée indéterminée — petit ou grand, partout en France ou ailleurs.',
 ARRAY['Premier CDI signé entre janvier 2025 et juin 2026','Témoigner du chemin parcouru avant la signature'],
 ARRAY['Justificatif du contrat (1ère page suffit)','Photo professionnelle ou personnelle'],2),
('premier-achat-immobilier','Premier achat immobilier','Les clés d''un toit à soi',
 'Devenir propriétaire pour la première fois — un cap symbolique, un jalon transmis. Nous célébrons l''audace et la rigueur de ce pas posé.',
 ARRAY['Premier bien acquis entre janvier 2025 et juin 2026','Acquisition à titre principal (résidence ou investissement)'],
 ARRAY['Attestation notariée ou compromis signé','Photo du bien (optionnelle)'],3),
('permis-de-conduire','Permis de conduire','L''horizon qui s''ouvre',
 'Le permis est une victoire trop souvent banalisée. Nous voulons l''honorer comme il le mérite : un pas vers la liberté, l''indépendance, et de nouveaux possibles.',
 ARRAY['Permis obtenu entre janvier 2025 et juin 2026','Tout type de permis (B, A, poids lourd, etc.)'],
 ARRAY['Copie du permis','Photo récente'],4),
('creation-d-entreprise','Création d''entreprise','L''audace de bâtir',
 'Pour les entrepreneurs qui ont franchi le pas et lancé leur structure. Auto-entreprise, SAS, association — chaque création est une étincelle.',
 ARRAY['Entreprise créée entre janvier 2025 et juin 2026','Activité en cours d''exercice au moment de la candidature'],
 ARRAY['Extrait K-bis ou SIREN','Présentation succincte de l''activité'],5),
('plume-inspiree','Plume inspirée','Pour ceux qui écrivent l''invisible',
 'Auteurs, poètes, blogueurs, scénaristes. Cette catégorie célèbre celles et ceux qui mettent en mots ce que beaucoup ressentent sans pouvoir le dire.',
 ARRAY['Œuvre publiée ou diffusée entre 2024 et 2026','Tout format : livre, blog, recueil, scénario'],
 ARRAY['Lien ou extrait de l''œuvre','Photo de l''auteur'],6),
('impact-influenceur-du-royaume','Impact & Influenceur du Royaume','Une voix qui éclaire',
 'Pour celles et ceux dont la voix — sur scène, en ligne, ou dans le quotidien — porte un message d''espérance et bâtit autour d''elle.',
 ARRAY['Activité d''influence active depuis au moins 12 mois','Message aligné avec les valeurs de Victorious'],
 ARRAY['Liens vers la plateforme principale','Brève bio'],7),
('premier-album-ou-single','Premier album ou single','La première note posée',
 'Le premier projet musical sorti — single, EP ou album. Une catégorie pour saluer le courage de faire entendre sa voix.',
 ARRAY['Projet sorti entre janvier 2025 et juin 2026','Distribution sur au moins une plateforme officielle'],
 ARRAY['Lien d''écoute (Spotify, Apple Music, YouTube…)','Visuel du projet'],8),
('famille','Famille','Le socle qui tient debout',
 'Mariage, naissance, restauration. Cette catégorie célèbre les familles qui se construisent, se reconstruisent ou s''agrandissent dans la fidélité.',
 ARRAY['Événement familial marquant entre janvier 2025 et juin 2026','Témoignage personnel partagé en toute simplicité'],
 ARRAY['Justificatif (acte, certificat ou attestation)','Photo de famille'],9);
