# Envoi des billets par e-mail

Réponses intégrées : envoi au contact **ET** à chaque participant, déclenché automatiquement **ET** disponible manuellement depuis l'admin, avec **billet PDF en pièce jointe** contenant un QR code.

## Ce qui sera livré

### 1. Génération du billet PDF
- Nouveau module `src/lib/ticket-pdf.ts` (côté serveur) utilisant `pdf-lib` (compatible Cloudflare Worker) + `qrcode` pour dessiner un QR code du `ticket_token` (le token en clair, pas son hash — le token brut est déjà retourné par `createReservation`/`updateReservation` et sert au check-in).
- Design du billet aux couleurs Victorious (violet profond + or) : logo texte "VICTORIOUS — La Nuit de l'Excellence", nom du participant, référence de réservation, date, lieu, ville, QR code, mention "À présenter à l'entrée".
- Un PDF par participant, nommé `victorious-{reference}-{prenom}.pdf`.

### 2. Nouveau server function `sendTicketEmails`
- Fichier `src/lib/ticket-email.functions.ts` (public, sans `requireSupabaseAuth` pour l'appel post-confirmation ; sécurisé par un token à usage unique passé depuis le flow de réservation) + variante admin protégée par rôle.
- Charge la réservation + participants + événement, régénère les PDFs, envoie via Resend (`RESEND_API_KEY` déjà configuré) en HTTP direct :
  - **1 e-mail par participant** → à son adresse, avec son PDF personnel en pièce jointe.
  - **1 e-mail récapitulatif** → au contact principal, avec **tous les PDFs** de la réservation attachés.
- Templates HTML simples inline (violet/or, cohérents avec l'identité), suffisants pour Resend (pas besoin d'introduire l'infrastructure Lovable Emails, qui ne supporte pas les pièces jointes).
- Chaque envoi est journalisé dans `ticket_email_log` (kind: `contact_recap` | `attendee_ticket`, `provider_id`, `status`, `error_message`).

### 3. Déclenchement automatique
- **À la confirmation** : dans `src/routes/billetterie.tsx`, après un `createReservation` renvoyant `status: "confirmed"`, appel de `sendTicketEmails({ reservationId, managementToken })` en fire-and-forget (l'échec e-mail ne bloque pas la confirmation ; l'utilisateur voit toujours l'écran de succès).
- **À la promotion depuis la liste d'attente** : dans `updateReservation` (RPC `promote_ticket_waitlist` retourne déjà `promoted_ids`), nouveau server fn `promoteAndNotify` qui, pour chaque ID promu, appelle `sendTicketEmails`. Idem si l'admin passe manuellement un reservation en `confirmed`.
- Idempotence : `ticket_email_log` est consulté avant envoi ; si un `attendee_ticket` a déjà été envoyé avec succès pour un attendee_id, il est sauté (sauf renvoi manuel forcé).

### 4. Renvoi manuel depuis l'admin
- Dans `src/routes/admin.billetterie.tsx`, ajout d'un bouton **"Renvoyer les billets"** sur chaque ligne de réservation confirmée (et d'un bouton "Renvoyer à ce participant" au niveau participant si la page de détail existe, sinon uniquement au niveau réservation).
- Le bouton appelle un server fn admin `resendTicketEmails` (protégé par `requireSupabaseAuth` + `has_role('admin')`), qui force l'envoi (contourne l'idempotence) et retourne un toast de succès/échec.

## Détails techniques

- **Pièces jointes Resend** : `attachments: [{ filename, content: base64 }]` — Resend gère nativement.
- **PDF léger** : ~30 Ko/participant avec `pdf-lib`, pas de font custom (Helvetica intégré) → compatible Worker.
- **QR code** : payload = token brut (32 caractères) ; l'admin scanne, l'app hache et appelle `check_in_ticket(hash)` déjà existant.
- **Sécurité** : le token brut n'est envoyé qu'à l'adresse e-mail du participant concerné ; le contact ne reçoit que les PDFs, pas les tokens en texte clair dans le corps de l'e-mail.
- **Dépendances à ajouter** : `pdf-lib`, `qrcode`. Les deux sont pure-JS et compatibles Cloudflare Worker.
- **Rien à modifier côté BDD** : `ticket_email_log` existe déjà avec les bons champs.

## Fichiers touchés
- Nouveaux : `src/lib/ticket-pdf.ts`, `src/lib/ticket-email.functions.ts`
- Modifiés : `src/routes/billetterie.tsx` (trigger post-succès), `src/routes/admin.billetterie.tsx` (bouton renvoi), `src/lib/ticketing.functions.ts` (hook sur promotion)
- `package.json` : `pdf-lib`, `qrcode`
