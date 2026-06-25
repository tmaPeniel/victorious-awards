## Objectif

Réharmoniser uniquement la palette de couleurs du site pour coller à l'affiche officielle Victorious 2026 (violet profond + or). Aucune modification de structure, typographie, images, animations, espacements ou contenu.

## Nouvelle palette (extraite de l'affiche)

- `--background` : violet nuit profond `oklch(0.18 0.08 295)` (fond principal)
- `--background-deep` : `oklch(0.12 0.06 290)` (zones les plus sombres)
- `--surface` / cartes : `oklch(0.22 0.09 295)` avec voile `oklch(0.28 0.10 295)`
- `--foreground` : blanc lavande chaud `oklch(0.96 0.02 300)`
- `--muted-foreground` : lavande douce `oklch(0.78 0.05 295)`
- `--primary` (accent OR principal) : `oklch(0.82 0.13 85)` (or champagne lumineux)
- `--primary-glow` : `oklch(0.90 0.10 90)` (halo doré)
- `--primary-deep` : `oklch(0.65 0.12 75)` (or vieilli pour profondeur)
- `--secondary` (violet clair lumineux) : `oklch(0.70 0.15 300)`
- `--border` : or translucide `oklch(0.82 0.13 85 / 0.25)`
- `--ring` : or `oklch(0.82 0.13 85 / 0.6)`

Gradients & effets :
- `--gradient-hero` : radial violet clair → violet profond (rappel halo affiche)
- `--gradient-gold` : linear or vieilli → or champagne → or vieilli (texte/séparateurs)
- `--gradient-surface` : violet 22% → violet 18%
- `--shadow-elegant` : `0 30px 80px -20px oklch(0 0 0 / 0.6)`
- `--shadow-gold` : `0 0 60px oklch(0.82 0.13 85 / 0.25)`
- `--glow-soft` : halo doré subtil pour hover

## Zones d'application (sans toucher au reste)

- **Fonds** : passage du noir obsidienne → violet nuit + dégradés radiaux subtils
- **Boutons VButton** (primary/ghost) : remplissage or champagne sur violet, hover halo doré
- **Liens importants & nav active** : doré
- **Icônes** : doré (catégories, séparateurs, chiffres countdown)
- **Séparateurs / filets** : déjà dorés — on harmonise la teinte
- **Bordures de cartes** (CategoryCard, Countdown, formulaires admin & candidater) : or translucide
- **Titres mis en valeur** (display Fraunces) : `--gradient-gold` en background-clip text sur titres clés (hero, sections)
- **Hover states** : intensification du halo doré + légère élévation
- **Admin panel** : même palette appliquée aux cartes stats, badges de statut, boutons

## Fichiers touchés

Uniquement `src/styles.css` :
- Mise à jour des tokens `:root` (couleurs, gradients, shadows)
- Ajustement des `@utility` existants (`gold-divider`, `glow-*`, etc.) pour utiliser les nouvelles variables
- Aucune modification des composants TSX, des routes ou du contenu

## Validation

1. `bunx tsgo` (sanity check — pas de changements TS attendus)
2. Playwright headless : capture `/`, `/categories`, `/candidater`, `/admin/login` en 1280×1800 pour vérifier l'ambiance violet+or vs affiche
3. Vérification contraste AA sur texte foreground/muted sur fond violet
