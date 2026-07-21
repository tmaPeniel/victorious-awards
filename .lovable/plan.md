## Gérer ma réservation via référence + e-mail

Ajouter un accès simple pour retrouver, modifier ou télécharger une réservation existante sans avoir besoin du lien sécurisé complet.

### Parcours utilisateur

1. Sur la page **Billetterie**, à côté du bouton "Je réserve", un bouton secondaire **"Gérer ma réservation"** ouvre une petite fenêtre.
2. Le visiteur y saisit :
   - Sa référence (ex. `VIC26-ABC12345`)
   - L'e-mail du contact utilisé lors de la réservation
3. En cas de correspondance, il est redirigé vers la page de gestion existante (`/billetterie/gerer`) où il peut modifier les participants, télécharger les billets PDF et renvoyer les liens WhatsApp.
4. Sur l'écran de confirmation après réservation, un rappel discret **"Gérer ma réservation plus tard"** est ajouté (en complément du lien sécurisé déjà présent).

### Sécurité

- Recherche protégée : 5 tentatives / 15 min par IP (réutilisation de `ticket_rate_limits`).
- Comparaison de l'e-mail insensible à la casse et aux espaces.
- Aucune information n'est retournée en cas d'échec (message générique "Référence ou e-mail introuvable").
- La récupération renvoie uniquement le **management token** (lien signé actuel) — les données ne transitent jamais sans ce token.

### Détails techniques

- Nouvelle fonction serveur `lookupReservation({ reference, email })` dans `src/lib/ticketing.functions.ts` qui :
  - Applique le rate-limit existant.
  - Cherche la réservation par `reference` + `lower(trim(contact_email))`.
  - Retourne un **nouveau management token** (régénère `management_token_hash`) — évite d'exposer un token existant et permet la révocation implicite.
- Nouveau composant `ManageBookingLookup` (modal/section repliable) sur `src/routes/billetterie.tsx` avec formulaire (référence + e-mail) et gestion d'erreurs.
- Après succès, redirection `navigate({ to: "/billetterie_/gerer", search: { token } })`.
- Ajout d'un lien texte "Gérer ma réservation" sur l'écran de succès (`ReservationSuccess`).

### Aucune migration SQL nécessaire

Tout se fait via la table existante `ticket_reservations`. La régénération du management token est un simple `UPDATE ... SET management_token_hash = ...` déclenché depuis la fonction serveur (via une RPC `security definer` ou directement via `supabaseAdmin` chargé dans le handler).

### Livrables

- `src/lib/ticketing.functions.ts` : nouvelle fonction `lookupReservation`.
- `src/routes/billetterie.tsx` : bouton "Gérer ma réservation" + modal, rappel sur l'écran de succès.
- Éventuellement une petite RPC SQL `lookup_ticket_reservation(reference, email, rate_key_hash)` pour garder la logique côté base (sécurité renforcée, atomique avec le rate-limit).
