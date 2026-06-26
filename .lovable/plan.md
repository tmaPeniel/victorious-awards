## Problème

110 photos sont bien dans le bucket Storage `gallery/2025/*` (uploadées manuellement), mais la table `gallery_items` est vide. La page `/galerie` et l'admin lisent cette table — d'où l'absence d'affichage.

## Solution : backfill automatique des 110 photos

Une seule migration SQL qui insère une ligne `gallery_items` pour chaque fichier `2025/*.jpg` présent dans le bucket, en sautant les doublons éventuels.

Pour chaque photo :
- `image_url` = chemin du fichier dans le bucket (ex. `2025/4V7A4105.jpg`)
- `alt` = `"Victorious 2025 — <nom du fichier>"`
- `caption` = `"Édition 2025"`
- `type` = `photo`
- `aspect` = `landscape` (ce sont des photos d'événement, format paysage natif Canon)
- `published` = `true`
- `sort_order` = incrémenté à partir du `created_at` du fichier dans le storage (ordre d'upload)

```sql
INSERT INTO public.gallery_items (image_url, alt, caption, type, aspect, sort_order, published)
SELECT
  o.name,
  'Victorious 2025 — ' || regexp_replace(split_part(o.name, '/', 2), '\.[^.]+$', ''),
  'Édition 2025',
  'photo',
  'landscape',
  row_number() OVER (ORDER BY o.created_at),
  true
FROM storage.objects o
WHERE o.bucket_id = 'gallery'
  AND o.name LIKE '2025/%'
  AND NOT EXISTS (
    SELECT 1 FROM public.gallery_items g WHERE g.image_url = o.name
  );
```

## Après la migration

- Les 110 photos apparaissent immédiatement sur `/galerie` (filtre "Photos" / "Tout"), avec lazy-loading, lightbox et signature d'URL via le helper existant `signMany`.
- Elles deviennent éditables depuis `/admin/gallery` : tu peux corriger légende, format (carré/portrait/paysage), ordre, ou les masquer/supprimer une par une.
- Aucun changement de code front-end, aucune nouvelle dépendance.

## Note sur le format

Je mets `landscape` par défaut. Si la majorité des photos sont en réalité portrait, dis-le moi et je bascule le défaut — sinon tu pourras ajuster au cas par cas dans l'admin.
