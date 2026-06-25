## Objectif

1. Corriger le positionnement du badge « Visionnaire » sur les portraits de l'équipe (page À propos) pour qu'il ne couvre plus les visages des Pasteurs Luka et Marie-Ange ANKOU.
2. Intégrer les photos de l'édition 2025 (lien OneDrive partagé) dans la galerie publique du site.

## Étapes

### 1. Correction du badge Visionnaire (`src/routes/a-propos.tsx`)

Aujourd'hui le badge est positionné en haut à gauche du portrait (`absolute left-3 top-3`), juste sur le visage. Deux ajustements combinés pour libérer le haut du cadre :

- **Déplacer le badge en bas du portrait** : `absolute left-3 bottom-3` (au lieu de `top-3`). Le bas de l'image est généralement plus neutre (vêtements / fond) et le badge reste lisible sur la photo.
- **Recadrage de l'image** : ajouter `object-top` à la balise `<img>` des membres `visionary` pour que le `object-cover` privilégie le haut du portrait (le visage) et coupe plutôt en bas.

Aucun autre changement de structure, de palette ou d'animation.

### 2. Récupération des photos OneDrive

Tentative automatique depuis le lien public partagé :

- Décoder l'URL `1drv.ms/f/...` pour obtenir l'URL canonique `onedrive.live.com`.
- Lister le contenu du dossier via l'API publique OneDrive (`https://api.onedrive.com/v1.0/shares/u!{base64url}/root/children`) qui fonctionne pour les liens « anyone with the link » sans authentification.
- Pour chaque fichier image retourné, télécharger le `@content.downloadUrl` dans `/tmp/victorious-2025/`.

Si l'API refuse l'accès (lien non vraiment public côté Microsoft, ou trop volumineux), je m'arrête et vous demande de joindre directement 6 à 10 photos dans le chat — je n'inventerai pas de visuels à la place.

### 3. Intégration dans la galerie

Une fois les photos téléchargées :

- Sélectionner **6 à 8 photos représentatives** (mix portraits / scène / ambiance) pour rester cohérent avec la grille actuelle (8 items).
- Les optimiser (redimensionnement max 1600 px de large, qualité JPEG ~80) et les déposer dans `src/assets/gallery/2025/` puis les externaliser via `lovable-assets` (pointeurs `.asset.json`) pour ne pas alourdir le repo.
- Mettre à jour `src/content/gallery.ts` :
  - Ajouter un champ `edition: "2025" | "2024"` sur chaque item.
  - Insérer les nouvelles photos **en tête** de la liste (édition la plus récente d'abord) avec des `alt` et `caption` descriptifs ("Victorious 2025 — …").
  - Conserver les items existants comme édition 2024.
- Optionnel mais cohérent : ajouter un sous-titre discret sur les cartes (`edition 2025` en champagne) — uniquement si ça reste sobre, sinon on garde l'UI actuelle inchangée.

### 4. Validation

- Typecheck (`bunx tsgo`).
- Vérification visuelle via Playwright :
  - `/a-propos` : screenshot rapproché des deux cartes Pasteurs pour confirmer que les visages sont visibles et que le badge est en bas, lisible.
  - `/galerie` : screenshot de la grille pour vérifier l'intégration harmonieuse des nouvelles photos 2025 (filtres « Tout » et « Photos » toujours fonctionnels).

## Détails techniques

- Aucune modification de la palette, typographie, structure des routes, du back-office, ni des autres pages.
- Les images 2025 passent par `lovable-assets` (CDN) pour rester légères dans le repo.
- L'`alt` de chaque photo reste descriptif et localisé en français pour préserver l'accessibilité et le SEO.
- Si OneDrive bloque l'accès programmatique malgré le lien public, je m'arrête après la correction du badge et vous redemande les photos en pièce jointe — pas de fallback inventé.
