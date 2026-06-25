## Problème
Sur `/categories`, `/galerie` (et de façon plus discrète sur `/contact` et `/a-propos`), le H1 du hero apparaît « transparent » : l'image de fond est trop lumineuse et l'overlay violet trop léger, donc le titre `text-ivory` se confond avec les zones claires de l'image (trophées, lustre…).

## Correction (CSS / présentation uniquement)
Aucun changement de structure, de typographie, d'image ou d'animation. On retravaille uniquement les calques d'arrière-plan des sections hero des 4 pages concernées :

1. **`src/routes/categories.index.tsx`** — hero « Neuf victoires. Neuf histoires. »
   - Baisser `opacity-35` → `opacity-20` sur l'`<img>`.
   - Renforcer l'overlay : passer à un dégradé radial sombre côté gauche (là où se trouve le texte) + voile global plus opaque, ex.
     `radial-gradient(ellipse at 0% 50%, oklch(0.10 0.05 290 / 0.92) 0%, oklch(0.10 0.05 290 / 0.55) 55%, transparent 80%), linear-gradient(180deg, oklch(0.10 0.05 290 / 0.80) 0%, oklch(0.10 0.05 290 / 0.97) 100%)`.

2. **`src/routes/galerie.tsx`** — hero « Fragments de nuits passées. »
   - `opacity-40` → `opacity-20` sur l'`<img>`.
   - Overlay renforcé (même logique : radial sombre à gauche + voile vertical plus dense).

3. **`src/routes/contact.tsx`** — hero « Écrivez‑nous. »
   - Vérifier et renforcer l'overlay de la même manière (radial sombre à gauche, voile global ≥ 0.85 en bas).

4. **`src/routes/a-propos.tsx`** — hero « Une nuit née d'une conviction. »
   - Le titre est déjà lisible, mais on harmonise : on s'assure que l'overlay reste plus dense côté gauche (radial à 0 %/30 % au lieu de 30 %/0 %) afin que la baseline soit cohérente avec les autres pages.

## Hors périmètre
- Page d'accueil : **non touchée**.
- Structure, composants, typographies, images, animations, espacements : inchangés.
- Aucune modification back-end / contenu / SEO.

## Vérification
Après application : capture Playwright des 4 pages (`/a-propos`, `/categories`, `/galerie`, `/contact`) en 1280×1800 pour confirmer que le H1 ressort nettement en ivoire/champagne sur fond violet profond.
