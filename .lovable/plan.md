Je vais corriger la règle d'accès côté base de données qui bloque les visiteurs non connectés.

Plan proposé :

1. **Séparer clairement les accès publics et admin**
   - Les visiteurs non connectés pourront lire uniquement les catégories publiées.
   - Les visiteurs non connectés pourront lire uniquement les photos publiées de la galerie.
   - Les admins garderont l'accès complet pour créer, modifier, masquer et supprimer.

2. **Supprimer l'appel au contrôle admin dans la règle publique**
   - La règle actuelle mélange “contenu publié” et “vérification admin”.
   - En mode non connecté, cette vérification admin provoque l'erreur `permission denied for function has_role`, donc la page publique ne reçoit rien.
   - Je vais remplacer cette règle par une règle publique simple : `published = true`.

3. **Conserver la sécurité du back-office**
   - La fonction de rôle admin restera utilisée uniquement pour les actions admin.
   - Je vérifierai que seuls les utilisateurs connectés/admin peuvent modifier les catégories et la galerie.

4. **Valider le résultat**
   - Tester la page `/categories` en mode non connecté.
   - Confirmer que la requête publique renvoie bien les 9 catégories publiées.
   - Vérifier aussi la galerie publique pour éviter le même blocage.