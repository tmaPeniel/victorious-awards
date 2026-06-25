
# Victorious — Site officiel

## 1. Direction artistique proposée : "La Nuit de l'Excellence"

Univers cérémonial chaleureux, éditorial et intemporel — à l'opposé des codes religieux classiques et des "awards show" génériques noir+or néon. L'inspiration : le moment où le rideau d'un opéra se lève sous une pluie de lumière dorée.

### Palette
- **Obsidienne** `#0B0A08` — fond principal nocturne, profond, légèrement chaud
- **Encre velours** `#161310` — surfaces secondaires
- **Champagne** `#E8D9B0` — accent principal (typo display, filets, lueurs)
- **Or vieilli** `#B8893F` — accent secondaire (CTA, soulignements)
- **Ivoire** `#F5EFE3` — texte principal sur fond sombre
- **Brique chaude** `#7A2E1E` — accent émotionnel ponctuel (catégorie Famille, CTA final)

Mode clair pour pages secondaires : ivoire `#F5EFE3` + obsidienne pour le texte, mêmes accents.

### Typographie
- **Display** : Fraunces (serif éditorial moderne, axes optiques, italique expressif) — pour hero, titres de section, noms de catégorie
- **Texte** : Inter Tight (sans-serif neutre, excellente lisibilité mobile) — pour le corps et l'UI
- Pairing chargé en contraste : display en très grande taille avec tracking négatif, texte en taille modérée avec interlignage généreux

### Signatures visuelles
- **Filets dorés** 1px qui se dessinent au scroll (left-to-right) sous chaque titre
- **Lueur radiale** champagne très douce derrière les éléments clés (countdown, CTA principal)
- **Grain photographique** subtil sur les fonds sombres (≈3% opacité)
- **Numérotation romaine** discrète pour les sections (I, II, III…) — clin d'œil cérémonial
- **Cadres photo** avec liseré champagne 1px + ombre portée chaude, ratio 4/5 portrait par défaut pour sublimer les visages
- **Boutons** : primaire = fond champagne, texte obsidienne, hover = lueur dorée pulsée ; secondaire = ghost avec bordure 1px champagne, hover = remplissage progressif

### Animations
- Apparitions au scroll feutrées (opacity + translateY 24px, 800ms cubic-bezier easing doux)
- Countdown : chiffres qui flip verticalement à chaque changement
- Cartes catégories : image qui zoome légèrement (scale 1.05) + voile dégradé qui se lève au hover
- Liens texte : soulignement doré qui se dessine de gauche à droite
- Pas de parallaxe agressive, pas de scroll hijacking — l'élégance prime

### Composants Design System (tokens dans `src/styles.css`)
Boutons (primary, secondary, ghost), Cards (pillar, category, info), Badge ("Édition 2025"), Section (avec numérotation romaine), Countdown, Accordion (FAQ), Stepper (parcours candidature), Gallery item, Form fields, Navigation (sticky avec backdrop blur), Footer.

## 2. Architecture technique

- **Stack** : TanStack Start (déjà en place), Tailwind v4, shadcn/ui customisé aux tokens Victorious
- **Fonts** : `@fontsource-variable/fraunces` + `@fontsource-variable/inter-tight`
- **Animations** : Motion (framer-motion) pour les apparitions au scroll et micro-interactions
- **Icônes** : Lucide pour l'UI, illustrations custom SVG pour les 3 piliers
- **Images** : placeholders générés (portraits clair-obscur) à remplacer plus tard

## 3. Périmètre v1 (cette livraison) — site public complet

### Routes
```
/                    Accueil
/a-propos            Histoire, vision, valeurs, équipe
/categories          Liste des 9 catégories
/categories/$slug    Fiche détail (bannière, description, critères, justificatifs, CTA)
/candidater          Formulaire multi-étapes + confirmation
/galerie             Photos / Vidéos / Replay avec filtres + lightbox
/contact             Formulaire + coordonnées + Google Maps + réseaux
/mentions-legales    Statique
```

Header sticky + footer présents sur toutes les pages. 404 et error boundaries soignés.

### Page d'accueil — structure
1. **Hero immersif** plein écran : "VICTORIOUS" en display monumentale, sous-titre "La Nuit de l'Excellence", date "25 Juillet" + lieu "ICC Rouen — Isneauville", countdown intégré typographiquement, 2 CTA
2. **Présentation** courte de Victorious avec filet doré
3. **Trois piliers** en triptyque numéroté (I. Rendre grâce, II. Inspirer, III. Connecter)
4. **Informations événement** (date, heure, lieu, dress code, programme à venir)
5. **Les 9 catégories** en mosaïque éditoriale (pas une grille banale)
6. **Comment candidater** en timeline verticale 4 étapes
7. **Aperçu galerie** (mosaïque 6-8 visuels) + CTA Voir toute la galerie
8. **FAQ** accordéon
9. **CTA final** très inspirant ("Et si votre histoire était la prochaine ?")

### Formulaire de candidature
Multi-étapes (Catégorie → Identité → Témoignage → Justificatifs → Confirmation), validation Zod, upload de fichiers en local-state (persistance branchée en v2 sur Lovable Cloud).

### Données (en dur dans `src/content/` pour la v1)
- 9 catégories (slug, titre, description, critères, justificatifs, image)
- 3 piliers
- Infos événement (date, heure, lieu, dress code)
- Équipe (3-4 membres placeholders)
- FAQ (8-10 questions)
- Galerie (12-16 visuels placeholders)

Structure pensée pour être migrée vers Supabase en v2 sans refonte des composants.

## 4. v2 (livraison future, non incluse dans cette PR)
- Activation Lovable Cloud (Supabase) avec auth admin
- Tables : `categories`, `applications`, `event_info`, `gallery_items`, `faq`, `team_members`
- Espace `/admin` protégé (RLS, rôle admin via table `user_roles`)
- Upload Storage pour justificatifs et galerie
- Edge function pour notification email à réception d'une candidature

## 5. Accessibilité & SEO
- Contrastes AA vérifiés (champagne sur obsidienne ≈ 10:1)
- Navigation clavier, focus-visible doré, `aria-label` sur boutons icônes
- Une `<main>` par page, hiérarchie H1→H2→H3 propre
- `head()` par route avec title/description/og distincts, `og:image` sur les leaves
- `lang="fr"`, alt descriptifs, lazy loading images, formats modernes
- `sitemap.xml` + `robots.txt` propres

## 6. Détails techniques
- Tokens Victorious dans `src/styles.css` via `@theme` (couleurs en oklch, polices, radius, ombres dorées)
- Composants réutilisables dans `src/components/victorious/` (Section, Pillar, CategoryCard, Countdown, Stepper, Gallery, FAQ, CTA)
- Données typées dans `src/content/*.ts`
- Routes TanStack file-based, navigation `<Link>` typée, pas de hash anchors pour les pages majeures
- Motion utilisé en composants client-only pour les animations au scroll

Une fois ce plan validé, je construis l'ensemble en une passe : tokens + fonts + composants DS d'abord, puis pages dans l'ordre Accueil → Catégories → Candidater → Galerie → À propos → Contact → Mentions.
