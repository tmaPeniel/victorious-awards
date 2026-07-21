## Envoi des billets par WhatsApp (via liens wa.me)

### Limite importante à connaître

Avec `wa.me` (clic-pour-discuter), **il n'y a pas d'envoi automatique** : c'est toujours quelqu'un qui doit cliquer sur un lien pour ouvrir WhatsApp et envoyer le message.

Le flux réaliste devient donc :
- À la fin de la réservation, on affiche au **contact** une page « Envoyer les billets par WhatsApp » avec un bouton par participant.
- Chaque bouton ouvre WhatsApp sur le téléphone du contact, avec la conversation pré-remplie vers le numéro du participant et un message contenant **le lien vers son billet en ligne (page web avec QR code)**.
- Le contact tape « Envoyer » dans WhatsApp → chaque inscrit reçoit son billet.
- Un bouton « M'envoyer les billets à moi » ouvre WhatsApp vers le numéro du contact (utile pour se les auto-envoyer / archiver).

Les e-mails de billets sont **retirés** (remplacés par WhatsApp comme demandé).

### Modifications base de données (1 migration)

- `ticket_reservations` : ajouter `contact_whatsapp` (texte, obligatoire, format E.164 ex. `+33612345678`).
- `ticket_attendees` : ajouter `whatsapp` (texte, optionnel — si vide, on utilisera celui du contact).
- Nouveau champ `ticket_send_log` (ou renommer `ticket_email_log`) pour tracer les clics « Envoyer via WhatsApp » (facultatif, sinon on garde le log actuel inutilisé pour info).

### Modifications formulaire de réservation (`billetterie.tsx`)

- Étape « Contact » : ajouter un champ **Numéro WhatsApp du contact** (obligatoire, validé E.164, avec sélecteur d'indicatif ou saisie libre + hint « ex. +33 6 12 34 56 78 »).
- Étape « Participants » : pour chaque participant, ajouter un champ **Numéro WhatsApp (optionnel)** — placeholder « Laisser vide pour utiliser celui du contact ».
- Validation Zod côté client + `.inputValidator` côté serveur (regex E.164 : `/^\+[1-9]\d{7,14}$/`).

### Nouvelle page « Envoyer les billets » (`/billetterie/envoi/$reference`)

Affichée automatiquement après confirmation, et accessible depuis la page « Gérer ma réservation » :

- Titre : « Envoyez leurs billets sur WhatsApp »
- Un bloc par participant :
  - Nom + numéro WhatsApp cible
  - Bouton **« Envoyer sur WhatsApp »** → lien `https://wa.me/<num>?text=<message pré-rempli>`
  - Message pré-rempli : « Bonjour {Prénom} 🎉 Voici votre billet pour Victorious 2026 le 21 mars à Rouen. Présentez le QR code à l'entrée : {URL_billet_public} »
  - Aperçu du message en dessous.
- Bouton secondaire « M'envoyer tous les billets » → wa.me vers le contact avec un message qui liste tous les liens.

### Page publique du billet (`/billet/$token`)

Déjà partiellement en place (`src/routes/billet.tsx`) — on s'assure qu'elle :
- affiche le QR code plein écran (scannable à l'entrée),
- nom du participant, référence, date, lieu,
- fonctionne hors-ligne une fois chargée (mise en cache basique).

Le PDF n'est plus la pièce centrale ; le lien vers cette page est ce qu'on envoie via WhatsApp. Le PDF reste téléchargeable depuis la page pour ceux qui préfèrent.

### Admin (`admin/billetterie/$id`)

- Remplacer le bouton « Renvoyer les billets par e-mail » par **« Ouvrir la page d'envoi WhatsApp »** → mène à la page ci-dessus.
- Afficher les numéros WhatsApp dans la fiche.

### Suppression / nettoyage

- Retirer les appels `sendReservationTicketEmails` dans `ticketing.functions.ts` (création, promotion liste d'attente, admin).
- Garder `ticket-pdf.server.ts` (utilisé par la page billet pour le téléchargement PDF).
- Supprimer `ticket-email.server.ts` **ou** le garder inactif pour un futur canal e-mail.

### Fichiers touchés

- **Migration** : ajout colonnes `contact_whatsapp`, `whatsapp`.
- **Nouveaux** : `src/routes/billetterie.envoi.$reference.tsx`, helpers `src/lib/whatsapp-link.ts`.
- **Modifiés** : `src/routes/billetterie.tsx` (champs + redirect vers page envoi), `src/routes/billetterie_.gerer.tsx` (bouton envoi), `src/routes/admin.billetterie.$id.tsx` (bouton envoi), `src/lib/ticketing.functions.ts` (schéma + retrait appels e-mail), `src/routes/billet.tsx` (finaliser affichage QR).

### Ce que ce plan ne fait PAS

- Pas d'envoi WhatsApp **automatique** (nécessiterait Twilio/Meta Business API + template Meta approuvé + numéro Business vérifié — plusieurs jours de setup côté Meta).
- Pas de pièce jointe PDF dans WhatsApp (les liens wa.me ne supportent que du texte). Le PDF reste téléchargeable depuis la page billet.

Si l'envoi 100 % automatique et le PDF joint sont indispensables, il faudra passer sur Twilio WhatsApp Business — dis-le-moi et je referai le plan avec ce fournisseur.