## Objectif

- Regrouper les photos de la galerie **par année** avec un titre au-dessus de chaque section.
- Afficher **10 photos** par défaut + bouton **« Voir plus »** qui charge 10 photos supplémentaires à chaque clic (par groupe d'année).

## Détection de l'année

Les `gallery_items` actuels n'ont pas de champ `year`. On l'extrait du champ `caption` :
- regex `\d{4}` sur la légende → trouve « 2025 » dans « Édition 2025 »
- fallback : extraction depuis `image_url` (les photos 2025 sont préfixées `2025/…`)
- si rien trouvé → groupe « Autres »

Pas de migration BDD nécessaire — purement front-end.

## Changements front-end

Un seul fichier touché : `src/routes/galerie.tsx`.

1. Après le filtre `type` existant (Tout / Photos / Vidéos / Replay), grouper les items restants par année (tri décroissant : 2025 d'abord).
2. Pour chaque groupe, rendre :
   - Un en-tête `<h2>` avec l'année (style cohérent : eyebrow doré + chiffre en grand `font-display`, ex. « Édition — 2025 »).
   - La grille existante (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) limitée aux N premières photos (N initialisé à 10 par groupe, stocké dans un `useState<Record<string, number>>`).
   - Sous la grille, si `total > N`, un bouton **« Voir plus (X restantes) »** qui fait `N += 10`.
3. Conserver la lightbox, le filtre, les animations Motion et le hero existants à l'identique.
4. Réinitialiser les compteurs quand le filtre `type` change (sinon la pagination devient incohérente).

## Détail UI du bouton

Même langage visuel que les filtres : bordure champagne, fond transparent au repos, fond champagne / texte obsidian au hover, hauteur 44 px, tracking large. Centré sous la grille avec une marge généreuse. Disparaît automatiquement quand toutes les photos du groupe sont affichées.

## Note erreur de build

Le message « ServiceUnavailable / Reduce your concurrent request rate » est une erreur transitoire de l'infra d'upload S3, sans rapport avec le code. Le prochain build passera sans modification.
