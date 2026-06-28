## 1. Corriger la soumission de candidature

**Diagnostic** : Au clic sur "Envoyer ma candidature" (étape 5 — Pièces), `validate()` parse l'ensemble du schéma. Si un champ d'une étape précédente est invalide (ex. téléphone trop court, témoignage < 80 caractères, email invalide), l'erreur est bien stockée mais **invisible** car le champ n'est pas rendu dans l'étape courante. L'utilisateur a l'impression que "rien ne se passe". Le checkbox RGPD lui-même n'est pas requis pour passer aux étapes suivantes — il n'est vérifié qu'à la soumission.

**Correctifs dans `src/routes/candidater.tsx`** :
- Si `validate()` échoue, identifier la première étape contenant un champ en erreur (mapping `category→1`, `firstName/lastName/email/phone→2`, `testimony→3`, `rgpd→4`) et y renvoyer l'utilisateur automatiquement via `setStep(...)`.
- Afficher une bannière d'erreur globale en haut du formulaire listant les champs manquants quand la soumission est bloquée (en plus des erreurs inline).
- Ajouter une validation **par étape** lors du clic "Continuer" (pas seulement à la soumission finale) pour ne plus pouvoir avancer avec des champs invalides.
- Logguer plus explicitement les erreurs Supabase (insert / upload) dans `submitError` pour rendre les vrais échecs réseau lisibles.

## 2. Mise à jour des critères d'éligibilité (Juillet 2025 → Juillet 2026)

Remplacer toutes les occurrences de la fenêtre temporelle dans le contenu :

- **`src/content/categories.ts`** : pour chaque catégorie, remplacer `"... entre janvier 2025 et juin 2026"` par `"... entre juillet 2025 et juillet 2026"` (8 catégories concernées + variantes "Œuvre publiée ou diffusée entre 2024 et 2026" → conserver ou aligner ? je propose d'aligner sur "juillet 2025 et juillet 2026" pour cohérence — à confirmer).
- **`src/routes/candidater.tsx`** (étape 0 "Avant de commencer") : remplacer la ligne `"Votre victoire se situe entre janvier 2025 et juin 2026."` par `"Votre victoire se situe entre juillet 2025 et juillet 2026."`.

> Note : les catégories affichées sur `/categories` sont désormais lues depuis la base (`gallery_items`/`categories`), mais leurs `criteria` ont été initialisés depuis ce fichier seed. Je mettrai aussi à jour les lignes correspondantes en base via une migration `UPDATE` pour que les fiches publiques reflètent la nouvelle fenêtre.

## Récapitulatif des fichiers touchés
- `src/routes/candidater.tsx` — fix soumission + texte étape 0
- `src/content/categories.ts` — textes des critères
- Migration SQL — `UPDATE public.categories SET criteria = ...` pour aligner la base
