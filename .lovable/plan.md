## Objectif

Intégrer les pasteurs Luka ANKOU et Marie-Ange ANKOU comme **Visionnaires** sur la page À propos, à deux endroits :
1. Section « Notre histoire » : un visuel commun (le couple) en accompagnement éditorial du récit fondateur.
2. Section « Notre équipe » : deux portraits individuels mis en avant en tête de la grille équipe.

## Étapes

### 1. Préparation des images
- Copier l'image source `user-uploads://Capture_d_écran_2026-06-25_à_18.45.11.png` dans `/tmp/`.
- Générer **3 assets** dans `src/assets/team/` à partir de cette photo via `imagegen--edit_image` :
  - `visionnaires-couple.jpg` (aspect 4:3) — recadrage doux du couple, ambiance préservée, pour la section Notre histoire.
  - `pasteur-luka.jpg` (aspect 3:4) — portrait individuel cadré sur Pasteur Luka (homme en tunique bleu marine).
  - `pasteur-marie-ange.jpg` (aspect 3:4) — portrait individuel cadré sur Pasteur Marie-Ange (femme à lunettes).
- Externaliser chaque image via `lovable-assets` pour rester léger (pointeurs `.asset.json`).

### 2. Contenu (`src/content/team.ts`)
Ajouter en tête de tableau deux nouvelles entrées avec un champ optionnel `photo` et `accent: "visionary"` :
- Pasteur Luka ANKOU — Visionnaire & Pasteur principal
- Pasteur Marie-Ange ANKOU — Visionnaire & Co-fondatrice

Conserver les 4 membres existants (sans photo, ils garderont le placeholder + initiale).

### 3. Section « Notre histoire » (`src/routes/a-propos.tsx`)
- Convertir le bloc texte actuel en grille 2 colonnes sur desktop (`lg:grid-cols-[1.3fr_1fr]`) :
  - Colonne gauche : les 3 paragraphes existants (inchangés).
  - Colonne droite : la photo du couple `visionnaires-couple.jpg` dans un cadre `shadow-frame` avec filet doré, surmontée d'une petite légende « Pasteurs Luka & Marie-Ange ANKOU — Visionnaires de Victorious ».
- Sur mobile, la photo passe sous le texte.

### 4. Section « Notre équipe »
- Garder la grille `sm:grid-cols-2 lg:grid-cols-4` actuelle.
- Pour les membres ayant un champ `photo`, afficher la vraie image (object-cover plein cadre) au lieu du placeholder + initiale. Le rôle des deux pasteurs porte la mention « Visionnaire » en champagne pour les distinguer visuellement.
- Pas de changement structurel : juste un rendu conditionnel dans le `.map()`.

### 5. Validation
- Typecheck.
- Vérification visuelle via Playwright sur `/a-propos` (desktop + mobile) — screenshot des deux sections concernées.

## Détails techniques

- Aucune modification de la palette, des typographies, des animations, des autres pages ou du back-office.
- Le composant `Section` et la grille équipe restent identiques (juste un branchement conditionnel sur `m.photo`).
- Les images sont servies via Lovable Assets (CDN) — pas de binaire dans `src/assets/`.
- L'accessibilité est préservée : chaque portrait reçoit un `alt` descriptif (« Portrait du Pasteur Luka ANKOU, visionnaire de Victorious »).
