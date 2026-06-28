# Alléger les photos de la galerie

Les 110 photos de l'édition 2025 sont stockées dans le bucket `gallery` à leur taille d'origine (souvent 3–8 Mo chacune en JPEG appareil photo). Le navigateur les télécharge en pleine résolution même pour les vignettes 300px, d'où la lenteur.

La bonne approche sur Lovable Cloud : utiliser les **transformations d'image de Supabase Storage** (redimensionnement + ré-encodage WebP à la volée, mises en cache au edge). Aucune re-upload nécessaire, les fichiers d'origine restent intacts.

## Ce que je vais faire

### 1. Helper de signature avec transformations
Étendre `src/lib/storage-urls.ts` pour accepter une option `transform` (width, quality, format) et l'inclure dans `createSignedUrl`. Supabase renvoie alors une URL signée qui sert une version redimensionnée + WebP.

### 2. Vignettes de galerie (page publique)
Dans `src/lib/use-gallery.ts` et `src/routes/galerie.tsx` :
- Vignette grille : `width: 600, quality: 70, format: 'origin'` (WebP auto) → ~40–80 Ko par image au lieu de plusieurs Mo
- Utiliser `srcset` avec deux variantes (600w / 1000w) pour les écrans Retina
- `loading="lazy"` est déjà en place

### 3. Lightbox (vue plein écran)
Charger une variante haute qualité séparée : `width: 1920, quality: 85`. Ouverture instantanée perçue car la vignette s'affiche déjà pendant le chargement.

### 4. Admin
La page `/admin/gallery` reçoit la même optimisation pour les vignettes 4:3 (`width: 500, quality: 70`).

## Détails techniques

- API Supabase : `supabase.storage.from('gallery').createSignedUrl(path, ttl, { transform: { width, quality, resize: 'cover' } })`
- Cache : Supabase met en cache les variantes au CDN, donc seule la première requête paie le coût de transformation
- Format : `format: 'origin'` laisse Supabase négocier WebP via `Accept` header (gain ~30 % vs JPEG)
- Pas de migration BDD, pas de re-upload, réversible en supprimant l'option `transform`

## Gain attendu

Page `/galerie` avec 10 photos visibles : passage d'environ 30–60 Mo téléchargés à ~0.5–1 Mo. Lightbox ~200–400 Ko par photo au lieu de 3–8 Mo.

## Hors scope

- Pas de re-compression des fichiers sources dans le bucket (inutile, les transformations couvrent le besoin)
- Pas de changement du flux d'upload admin
