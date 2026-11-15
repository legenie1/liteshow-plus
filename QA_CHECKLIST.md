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

## Diapo du thème

- [ ] Sans diapo marquée, le bouton "Thème" est désactivé et la touche "T" ne fait rien
- [ ] Cliquer l'étoile d'une vignette → la diapo est marquée, sans être projetée
- [ ] Bouton "Thème" ou touche "T" → la diapo du thème s'affiche, y compris pendant un écran noir
- [ ] Deuxième appui ("Revenir") → retour à la diapo interrompue
- [ ] Depuis le thème, flèche suivante → passe à la diapo qui suit la diapo interrompue
- [ ] Fermer puis rouvrir l'app, re-choisir le dossier → le thème est retenu pour ce dossier, pas pour les autres

## Onglet Vidéos

- [ ] Onglet "Vidéos" → "Choisir un dossier" liste les mp4/webm/mov du dossier, ignore le reste, et ne touche pas à la liste des diapos
- [ ] Les vignettes affichent une image de la vidéo (pas un cadre noir) ; un dossier de 30 vidéos ne fige pas l'interface
- [ ] Cliquer une vidéo → elle démarre seule sur l'écran de projection, avec le son, sans aucun clic dans la fenêtre de projection
- [ ] Espace → pause, Espace → reprise (la fenêtre de contrôle garde le focus)
- [ ] Cliquer la vidéo en cours → elle repart du début
- [ ] Flèches → vidéo suivante/précédente, arrêt au bord de la liste
- [ ] Bouton "Boucle" (sur la carte de la vidéo projetée) ou touche "L" → la vidéo se rejoue sans s'arrêter ; L à nouveau → elle s'arrête à la fin. Le mode reste actif en passant à une autre vidéo
- [ ] Bouton "Muet" (sur la carte de la vidéo projetée) ou touche "M" → le son se coupe sans interrompre l'image ; M à nouveau → le son revient. Le mode reste actif en passant à une autre vidéo
- [ ] "B" pendant une vidéo → écran noir et le son s'arrête ; "B" à nouveau → image figée, Espace relance
- [ ] Cliquer une diapo (onglet Diapos) pendant une vidéo → la vidéo disparaît, la diapo s'affiche, plus de son
- [ ] Touche "T" pendant une vidéo → la diapo du thème remplace la vidéo
- [ ] Une vidéo MP4 non faststart (moov en fin de fichier) de plus de 1 Go démarre en moins de 2-3 s et se laisse déplacer au curseur sans plantage
- [ ] Un fichier .mp4 corrompu ou un codec non pris en charge affiche "Vidéo illisible…" sans bloquer la suite
- [ ] Un nom de fichier avec accents, espaces et # (ex. "Intro été #2.mp4") se lit normalement

## Poids et démarrage

- [ ] `pnpm tauri build` produit un exécutable/installeur, taille totale du bundle < 30 Mo
- [ ] L'app démarre en moins de 2-3 secondes sur une machine standard
