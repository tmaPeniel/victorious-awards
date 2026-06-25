# Victorious — V2 : Back-office administrable

Activation de Lovable Cloud et bascule de tous les contenus en base, avec un espace admin protégé pour piloter le site sans toucher au code.

## 1. Activation Lovable Cloud
- Active Lovable Cloud (auth + base de données + storage).
- Auth email/mot de passe pour les administrateurs uniquement (pas d'inscription publique).

## 2. Modèle de données
Tables créées par migration, RLS activée, GRANTs explicites :
- `app_role` (enum : `admin`) + `user_roles` + fonction `has_role()` (sécurité anti-escalade).
- `event_info` (singleton : date, heure, lieu, dress code, programme).
- `pillars` (3 piliers : numéro, titre, sous-titre, texte, ordre).
- `categories` (slug, titre, description, critères[], justificatifs[], image, ordre, visible).
- `faq` (question, réponse, ordre, visible).
- `team_members` (nom, rôle, photo, ordre).
- `gallery_items` (type photo/vidéo/replay, src, alt, légende, aspect, ordre, visible).
- `applications` (candidatures reçues : catégorie, identité, témoignage, statut, urls justificatifs, créé_le).

Lectures publiques (anon SELECT) sur tout sauf `applications` et `user_roles`. Écritures réservées aux admins.

## 3. Storage
- Bucket `gallery` public en lecture, écriture admin (upload photos galerie + photos équipe).
- Bucket `applications` privé (justificatifs des candidatures, accessible uniquement par admin).

## 4. Lecture côté site public
- Les pages d'accueil, catégories, galerie, à propos, contact basculent du contenu statique `src/content/*` vers des `createServerFn` publics qui lisent via la clé publishable.
- Loaders TanStack + TanStack Query pour SSR + SEO conservés.
- Les fichiers `src/content/*` sont conservés en seed initial via migration (INSERT des données actuelles).

## 5. Soumission de candidature
- Le formulaire `/candidater` insère désormais dans `applications` et upload les justificatifs dans `applications/{id}/`.
- Page de confirmation avec numéro de dossier.
- Validation Zod côté client + server function avec rate-limiting basique (1 candidature/email/catégorie).

## 6. Espace admin `/admin` (sous `_authenticated`)
Layout admin minimaliste cohérent avec l'identité Victorious mais orienté productivité (sidebar sombre, tables denses, formulaires clairs).

Pages :
- `/auth` — connexion email/mot de passe (publique).
- `/admin` — tableau de bord (candidatures récentes, compteurs par catégorie).
- `/admin/candidatures` — liste filtrable + détail + changement de statut (nouveau / en revue / retenu / refusé) + téléchargement justificatifs.
- `/admin/categories` — CRUD complet, drag-to-reorder.
- `/admin/event` — édition du singleton event_info.
- `/admin/piliers` — CRUD 3 piliers.
- `/admin/faq` — CRUD + réorganisation.
- `/admin/equipe` — CRUD + upload photo.
- `/admin/galerie` — upload multiple, tri, masquer/afficher, suppression.

Sécurité : gate `_authenticated` (intégration gérée) + double-check `has_role('admin')` dans chaque server function d'écriture. Premier admin créé par migration (email à fournir par vous).

## 7. Notifications
Edge function (server route `/api/public/notify-application`) déclenchée à la création d'une candidature → email récap à l'adresse admin via Resend (clé à fournir).

## 8. Détails techniques
- Server functions sous `src/lib/*.functions.ts` (lecture publique avec client publishable, écriture avec `requireSupabaseAuth` + check `has_role`).
- Loaders publics utilisent les fns publiques (pas de bearer requis → compatible SSR/prerender).
- Pages admin sous `src/routes/_authenticated/admin.*.tsx`.
- Toasts via `sonner` déjà installé.
- shadcn `Table`, `Dialog`, `Form`, `DropdownMenu` réutilisés pour le back-office.

## Questions avant lancement
1. **Email du premier administrateur** à pré-créer dans la migration ?
2. **Notifications email** à la réception d'une candidature : on les inclut dans la V2 (nécessite une clé Resend) ou on remet à plus tard ?
3. **Drag-to-reorder** dans l'admin : nice-to-have, ou simple champ "ordre" numérique suffit pour la V2 ?
