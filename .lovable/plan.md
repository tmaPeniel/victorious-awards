# Nouvelle page Témoignages

Une page publique `/temoignages` listant les témoignages des précédents vainqueurs, avec deux formats côte à côte : témoignages écrits (photo + citation + parcours) et témoignages vidéo (lecteur intégré).

## Ce qui sera livré

### 1. Base de données (nouvelle table `testimonials`)

Champs :

- `type` : `written` ou `video`
- `winner_name` (nom du lauréat)
- `category_slug` (référence à la catégorie remportée, optionnel)
- `edition_year` (ex : 2024, 2025)
- `quote` (texte du témoignage — pour les écrits ; sous-titre court pour les vidéos)
- `full_story` (texte long, optionnel, pour les écrits)
- `photo_url` (portrait, stocké dans un nouveau bucket `testimonials`)
- `video_url` (URL YouTube/Vimeo **ou** fichier hébergé dans le bucket)
- `video_thumbnail_url` (miniature pour les vidéos)
- `sort_order`, `published`, timestamps

RLS : lecture publique si `published = true`, écriture réservée aux admins (même pattern que `gallery_items` / `categories`).

Bucket privé `testimonials` pour photos + éventuelles vidéos uploadées (avec URL signées côté lecture, comme la galerie).

### 2. Page publique `/temoignages`

- **Hero** immersif (violet/or, image de fond générée dans l'univers de la cérémonie), titre + intro.
- **Filtre** par année (`Toutes` / `2025` / `2024` …) et par type (`Tous` / `Écrits` / `Vidéos`).
- **Section Témoignages vidéo** : grille de cartes cliquables → ouverture dans un lecteur modal (YouTube/Vimeo embed ou `<video>` natif).
- **Section Témoignages écrits** : cartes éditoriales avec portrait, citation en display italique, nom + catégorie + édition, bouton "Lire le témoignage complet" (ouvre un drawer si `full_story` renseigné).
- **CTA final** vers `/candidater`.

Métadonnées SEO propres (title, description, og).

### 3. Admin `/admin/testimonials`

- Liste des témoignages (type, nom, année, statut publié) + tri, filtre, recherche.
- Création / édition : formulaire unifié qui adapte les champs selon `type` (écrit vs vidéo).
- Upload photo → bucket `testimonials`.
- Vidéo : soit champ URL (YouTube/Vimeo — détection automatique du format d'embed), soit upload fichier `.mp4`.
- Toggle publié, suppression, réordonnancement.

### 4. Navigation

Ajout du lien "Témoignages" dans le header et le footer (entre "Catégories" et "Galerie").

## Détails techniques

- Migration Supabase créant `testimonials` + GRANT + RLS + trigger `updated_at`.
- Bucket `testimonials` (privé) créé via l'outil dédié, avec policies sur `storage.objects`.
- Hook `use-testimonials.ts` (lecture publique via supabase client).
- Composant `TestimonialCard` (variantes `written` / `video`) et `VideoLightbox` (dialog shadcn existant).
- Détection URL YouTube/Vimeo dans un util `parseVideoUrl.ts` pour construire l'iframe embed.
- Route admin protégée sous `_authenticated` (comme les autres pages admin) + entrée dans le dashboard `/admin`.

## Question rapide avant de coder

Est-ce que tu veux que je **seed** la page avec quelques témoignages fictifs pour la démo (que tu remplaceras via l'admin), ou je livre la page vide et tu ajoutes tout toi-même depuis le back-office ? Seed