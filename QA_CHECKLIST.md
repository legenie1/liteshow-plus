# LiteShow — Checklist de QA manuelle

Pas de tests e2e en v1 (voir CLAUDE.md). Cette checklist sert de filet avant de considérer une version utilisable en régie réelle. À dérouler manuellement, avec un vrai second écran/projecteur branché si possible.

## Sélection de dossier

- [ ] Choisir un dossier contenant des JPG/PNG/WEBP → la liste se remplit avec les bons noms de fichiers
- [ ] Choisir un dossier vide → message "Aucune image" affiché, pas de crash
- [ ] Choisir un dossier contenant des fichiers non-image (PDF, TXT, sous-dossiers) → ils sont bien ignorés
- [ ] Re-choisir un autre dossier après un premier chargement → la liste se remplace proprement

## Vignettes

- [ ] Chaque image affiche sa vignette (pas juste un cadre vide) après un court délai
- [ ] Une image corrompue/illisible dans le dossier n'empêche pas les autres vignettes de charger
- [ ] Rouvrir le même dossier une seconde fois → les vignettes apparaissent plus vite (cache)

## Écran de projection

- [ ] Le menu déroulant liste bien tous les écrans connectés, avec le bon écran marqué "(principal)"
- [ ] Sélectionner un écran → une fenêtre sans bordure ni barre de titre s'ouvre en plein écran sur cet écran, fond noir
- [ ] Changer d'écran sélectionné → la fenêtre de projection se déplace sur le nouvel écran (pas de doublon de fenêtre)
- [ ] Fermer puis rouvrir l'app → l'écran précédemment choisi est retenu et la fenêtre de projection s'ouvre dessus automatiquement

## Projection d'images

- [ ] Cliquer sur une vignette → l'image s'affiche instantanément en plein écran sur l'écran secondaire
- [ ] La vignette de l'image actuellement projetée est visuellement mise en surbrillance
- [ ] Une image plus large que haute (paysage) et une image plus haute que large (portrait) s'affichent toutes les deux entières, centrées, sans déformation ni recadrage
- [ ] Avant toute sélection, l'écran de projection est noir (pas blanc, pas d'erreur affichée)

## Navigation clavier

- [ ] Flèche bas / droite → passe à l'image suivante de la liste
- [ ] Flèche haut / gauche → revient à l'image précédente
- [ ] Arriver au dernier élément avec flèche suivante → reste sur le dernier (pas de crash, pas de retour au début)
- [ ] Touche "B" → coupe la projection (écran noir) sans fermer l'app ni perdre la sélection
- [ ] Toucher "B" à nouveau → l'image précédemment sélectionnée réapparaît
- [ ] Cliquer une nouvelle vignette pendant l'écran noir → annule le noir et projette l'image choisie

## Poids et démarrage

- [ ] `pnpm tauri build` produit un exécutable/installeur, taille totale du bundle < 30 Mo
- [ ] L'app démarre en moins de 2-3 secondes sur une machine standard
