## Diagnostic

Les 9 catégories existent bien en base et sont toutes `published = true`. Les politiques RLS autorisent la lecture publique. **Mais** les tables `categories` et `gallery_items` n'ont **aucun GRANT** pour les rôles `anon`, `authenticated` et `service_role`.

Sans ces GRANT, l'API Data (PostgREST) refuse l'accès — d'où la liste vide sur le site publié (en local on ne voyait pas le souci parce que la requête tombait probablement en cache ou que vous étiez connecté admin via une session différente).

## Correction

Une seule migration qui ajoute les permissions manquantes :

```sql
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
```

Aucun changement de code applicatif n'est requis : les pages `/categories` et `/galerie` retrouveront automatiquement leur contenu une fois la migration appliquée.
