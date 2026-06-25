## V3 — Back-office étendu : Export, Galerie & Catégories

Objectif : enrichir l'espace admin (`/admin`) pour que vous puissiez tout piloter sans toucher au code.

---

### 1. Export Excel des candidatures

Sur `/admin/applications` :
- Bouton **« Exporter en Excel »** en haut à droite (à côté du filtre recherche).
- Respecte le filtre statut + recherche en cours (export ce qui est affiché).
- Génère un `.xlsx` avec colonnes : Nom, Prénom, Email, Téléphone, Catégorie, Statut, Témoignage, Date de réception, Notes admin, Lien photo, Lien justificatif (URLs signées 7j).
- Mise en forme : en-têtes gras dorés, largeur auto, format date FR.
- Bibliothèque : `xlsx` (SheetJS), génération 100 % côté client (pas besoin de server fn).

---

### 2. Gestion de la Galerie depuis l'admin

Nouvelle page `/admin/gallery` (lien dans la nav admin).

**Base de données** (nouvelle table `gallery_items`) :
- `image_path` (storage), `alt`, `caption`, `type` (photo/video/replay), `aspect` (portrait/landscape/square), `sort_order`, `published` (bool), `created_at`.
- Bucket Storage **public** `gallery` pour servir les images directement (sans URL signée).
- RLS : lecture publique des items `published=true`, écriture admin uniquement.

**UI Admin** :
- Grille des photos existantes (vignettes) avec : aperçu, caption, toggle publié, bouton supprimer.
- Bouton **« Ajouter des photos »** : upload multiple (drag & drop), avec champs caption + type + aspect par image.
- Réordonnancement par drag & drop (sort_order).

**Côté public** :
- `src/routes/galerie.tsx` lit la table `gallery_items` (filtré `published=true`, ordonné par `sort_order`) au lieu du fichier statique `src/content/gallery.ts`.
- Les 8 photos actuelles du fichier statique sont seedées dans la table via migration pour ne rien perdre.

---

### 3. Gestion des Catégories depuis l'admin

Nouvelle page `/admin/categories` (lien dans la nav admin).

**Base de données** (nouvelle table `categories`) :
- `slug` (unique), `title`, `tagline`, `description`, `criteria` (text[]), `documents` (text[]), `image_path`, `sort_order`, `published`, `created_at`, `updated_at`.
- RLS : lecture publique, écriture admin.
- Seed initial : import des 9 catégories actuelles de `src/content/categories.ts`.

**UI Admin** :
- Liste des 9 catégories (titre, slug, statut publié, bouton « Modifier »).
- Page d'édition `/admin/categories/$slug` : formulaire complet (titre, tagline, description, critères en liste éditable, documents requis en liste éditable, upload image de remplacement, toggle publié).
- Bouton « + Nouvelle catégorie ».
- Réordonnancement par drag & drop.

**Côté public** :
- `src/routes/categories.index.tsx` et `categories.$slug.tsx` lisent depuis Supabase au lieu du fichier statique.
- Le formulaire candidat (`/candidater`) charge la liste des catégories depuis la base.

---

### Stack & détails techniques

- **TanStack Query** pour toutes les lectures admin (cache + invalidation après mutation).
- **Drag & drop** : `@dnd-kit/core` + `@dnd-kit/sortable` (léger, accessible).
- **Excel** : `xlsx` (SheetJS), import dynamique pour ne pas alourdir le bundle public.
- **Storage** : nouveau bucket public `gallery`, bucket public `category-images` pour les visuels catégories.
- **Migrations** : 3 migrations (tables `gallery_items`, `categories`, seeds).
- Navigation admin : ajout des liens « Galerie » et « Catégories » dans `admin.tsx`.

---

### Plan d'exécution

1. Migrations : créer `categories`, `gallery_items`, buckets publics, seeder le contenu existant.
2. Page admin Catégories (liste + édition).
3. Page admin Galerie (upload + grille + réordonnancement).
4. Bouton export Excel sur `/admin/applications`.
5. Branchement des pages publiques (galerie, catégories) sur la base.
6. Validation : typecheck + test Playwright des flux admin (créer/modifier/publier/exporter).
