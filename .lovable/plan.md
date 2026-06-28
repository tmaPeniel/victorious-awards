## 1. Témoignage déjà rendu optionnel
La contrainte de 80 caractères minimum a été retirée au tour précédent (`testimony` est désormais `.optional()` dans le schéma Zod et le label affiche "Témoignage (optionnel)"). Si le champ apparaît encore obligatoire, c'est probablement un cache navigateur — rien à modifier côté code.

## 2. Corriger l'erreur RLS sur `applications`
La table `public.applications` possède bien une policy `INSERT` permissive (`Anyone can submit an application — WITH CHECK (true)` pour `anon, authenticated`), donc l'insert depuis le formulaire devrait passer. Si l'erreur RLS apparaît malgré tout, c'est en général lié à :
- une policy `INSERT` manquante ou cassée après un remix,
- ou l'upload Storage (`application-files`) qui exige une policy d'`INSERT` pour `anon`/`authenticated` sur `storage.objects`.

### Migration de durcissement
- Recréer proprement la policy `INSERT` publique sur `public.applications` (DROP + CREATE) pour garantir `TO anon, authenticated WITH CHECK (true)`.
- Ajouter (si manquantes) les policies Storage sur le bucket `application-files` :
  - `INSERT` autorisé pour `anon, authenticated` (upload d'une candidature),
  - lecture restreinte aux admins (déjà privé).

### Vérification
Après la migration, soumettre une candidature de test depuis `/candidater` et confirmer dans `/admin/applications` qu'elle apparaît, avec photo/justificatif uploadés correctement.

## Fichiers / objets touchés
- Migration SQL — policies `applications` + `storage.objects` (bucket `application-files`).
- Aucun changement de code applicatif nécessaire.
