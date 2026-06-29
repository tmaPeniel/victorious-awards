## Problème

Tu as supprimé des fichiers directement dans le bucket Storage `gallery`, mais la table `gallery_items` (qui alimente /admin/gallery et /galerie) garde des lignes pointant vers des fichiers qui n'existent plus → vignettes cassées côté admin et entrées fantômes côté public.

Le Storage et la table sont deux systèmes distincts : Supabase ne lie pas automatiquement la suppression d'un objet à la suppression de sa ligne. Il faut soit nettoyer, soit automatiser.

## Solution proposée (2 volets)

### 1. Nettoyage immédiat
Migration SQL qui liste les objets réellement présents dans `storage.objects` (bucket `gallery`) et supprime de `gallery_items` toute ligne dont `image_url` n'a pas de fichier correspondant. Effet : l'admin et la galerie publique reflètent l'état réel du bucket.

### 2. Synchronisation automatique permanente
Trigger PostgreSQL `AFTER DELETE ON storage.objects` (filtré sur `bucket_id = 'gallery'`) qui supprime la ligne correspondante de `gallery_items` (`WHERE image_url = OLD.name`). À partir de là, toute suppression de fichier — via l'admin Lovable Cloud, via l'app, ou via l'API Storage — purge automatiquement la ligne associée. Aucune action côté code applicatif.

Inversement, on garde l'app comme seule source qui *crée* des `gallery_items` (l'upload admin insère déjà la ligne après l'upload du fichier) — on n'ajoute pas d'auto-création depuis le bucket pour éviter des entrées sans légende/ordre.

## Fichiers / objets touchés
- Migration SQL unique :
  - DELETE des `gallery_items` orphelins,
  - fonction `public.handle_gallery_object_delete()` (SECURITY DEFINER),
  - trigger `on_gallery_object_delete` sur `storage.objects`.
- Aucun changement de code applicatif.

## Vérification
1. Recharger `/admin/gallery` → seules les photos réellement présentes apparaissent.
2. Supprimer un fichier du bucket via l'admin Cloud → la ligne disparaît côté `/admin/gallery` et `/galerie` au refresh.
