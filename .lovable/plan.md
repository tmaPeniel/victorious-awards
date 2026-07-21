## Diagnostic

Le module `src/lib/ticketing.functions.ts` contient plusieurs incohérences qui bloquent le build et empêchent la réservation de billet de fonctionner :

1. **Toutes les server functions utilisent `.validator(...)`** alors que TanStack Start attend `.inputValidator(...)`. Résultat : chaque fn de billetterie est cassée, donc TypeScript ne connaît plus le type de `data` (d'où tous les `implicit any`).
2. **Le code lit/écrit une colonne `ticket_version`** sur `ticket_attendees` — cette colonne **n'existe pas** en base. Elle sert à invalider les anciens QR codes quand un participant est modifié. Il faut donc l'ajouter en base.
3. **Le code appelle un RPC `get_ticketing_availability`** — ce RPC **n'existe pas** en base. Il faut le créer (lecture publique de la disponibilité).
4. **`src/routes/billetterie_.gerer.tsx:69`** : `person` a un type `any` implicite parce que le retour de `getManagedReservation` casse à cause des erreurs précédentes. Une fois les corrections faites, on ajoute juste un type explicite au `.map`.

## Correctifs

### 1. Base de données (migration unique)

- Ajouter `ticket_version smallint NOT NULL DEFAULT 1` sur `public.ticket_attendees`.
- Créer la fonction RPC `public.get_ticketing_availability(p_event_slug text)` en `SECURITY DEFINER` (search_path `public`), accessible en `EXECUTE` à `anon` et `authenticated`, qui renvoie un `jsonb` avec la même forme que celle attendue côté client :
  ```json
  { "state": "unconfigured|open|closed",
    "event": { "name", "startsAt", "venue", "city", "capacity" } | null,
    "confirmed": <int>, "remaining": <int> }
  ```
- Mettre à jour `create_ticket_reservation` et `update_ticket_reservation` pour lire/écrire `ticket_version` (valeur par défaut 1 à l'insert ; à la mise à jour, incrémenter côté SQL n'est pas nécessaire — le server fn envoie déjà le bon `ticket_version` dans le payload, il suffit d'ajouter la colonne à l'`UPDATE`).

### 2. `src/lib/ticketing.functions.ts`

- Remplacer chaque `.validator((data: unknown) => schema.parse(data))` par `.inputValidator((data: unknown) => schema.parse(data))` (6 occurrences).
- Ne rien changer à la logique `ticket_version` / `get_ticketing_availability` : elle devient valide dès que la migration passe.
- Typer explicitement le `.map` du fallback attendees en RLS pour retirer les derniers `any` implicites.

### 3. `src/routes/billetterie_.gerer.tsx`

- Ajouter un type explicite au paramètre `person` du `.map` (dérivé du retour de `getManagedReservation`) — 1 ligne.

## Validation

- Typecheck jusqu'à zéro erreur.
- Test rapide de bout en bout : appeler `getTicketingAvailability` (doit renvoyer `open` avec `remaining`), puis simuler une réservation via l'UI pour confirmer que le flux revient à la normale.

## Détails techniques

- La migration reste additive : ajout d'une colonne avec default + création d'un RPC public + patch de deux RPC existants. Aucune donnée existante n'est perdue (tous les `ticket_version` en base seront `1`, ce qui correspond à la version initiale que le code re-dérive via `deterministicToken` sans suffixe `:vN`).
- Le RPC `get_ticketing_availability` est `SECURITY DEFINER` parce que les policies actuelles n'exposent pas `ticket_events` / `ticket_attendees` en lecture anonyme, et on ne veut pas les ouvrir globalement.
