# Visionneuse de Projection Légère
*(Nom provisoire — à définir : "LiteShow", "ProjectLite", "SlideCast"...)*

Une application de projection minimaliste pour images, pensée comme alternative légère aux logiciels du marché (EasyWorship, ProPresenter, FreeShow...).

---

## 1. Contexte et problématique

Les logiciels de présentation/projection existants pour l'église ou l'événementiel sont souvent **volumineux et complexes**, car ils intègrent de nombreuses fonctionnalités (paroles de chants, Bible, vidéos, streaming, effets, etc.) que tous les utilisateurs n'utilisent pas forcément.

**Problème identifié :** il n'existe pas assez d'options simples et légères pour un besoin précis — projeter rapidement des images (slides, versets, annonces, paroles pré-formatées en images, etc.) sur un écran secondaire, sans configuration complexe.

## 2. Vision du produit

Créer une application **minimaliste, rapide et intuitive**, dédiée uniquement à la **projection d'images en plein écran** sur un second écran, avec un contrôle simple depuis l'écran principal.

**Principe directeur :** faire une seule chose, et bien la faire.

## 3. Public cible

- Équipes techniques d'église (régie, projection de versets/annonces)
- Organisateurs d'événements, conférences, mariages
- Enseignants/formateurs qui projettent des slides images (déjà exportées en JPG/PNG depuis Canva, PowerPoint, etc.)
- Toute personne cherchant une alternative légère aux gros logiciels de présentation

## 4. Concept général

L'application fonctionne en **deux zones d'affichage distinctes** :

| Écran | Rôle |
|---|---|
| **Écran principal** (poste de contrôle) | Affiche une bande/barre verticale de vignettes (miniatures) de toutes les images du dossier sélectionné, avec leur nom affiché |
| **Écran secondaire** (projecteur/TV) | Affiche l'image sélectionnée en **plein écran**, sans aucun élément d'interface |

L'opérateur clique sur une vignette dans la barre de contrôle → l'image s'affiche instantanément en plein écran sur l'écran secondaire.

## 5. Fonctionnalités principales (MVP)

### 5.1 Sélection de dossier
- Bouton pour choisir un dossier source contenant les images à projeter
- Formats supportés : JPG, PNG, (WEBP en option)
- Lecture automatique du contenu du dossier (pas besoin d'importer un par un)

### 5.2 Barre de vignettes (panneau de contrôle)
- Liste verticale scrollable des images du dossier
- Chaque vignette affiche :
  - Miniature de l'image
  - Nom du fichier (au-dessus ou en dessous de la vignette)
- Image actuellement projetée mise en surbrillance (bordure/couleur distincte)
- Clic sur une vignette = projection immédiate

### 5.3 Sélection de l'écran de projection
- Détection automatique des écrans connectés
- Menu déroulant pour choisir l'écran secondaire cible
- Mémorisation du choix pour les prochaines sessions

### 5.4 Fenêtre de projection
- Fenêtre plein écran (kiosk mode), sans barre de titre, sans bordures
- Fond noir par défaut entre deux images (pas d'écran blanc)
- Image centrée, adaptée à la résolution de l'écran (contain, sans déformation)

### 5.5 Navigation rapide
- Flèches clavier (haut/bas) pour naviguer entre les images de la liste
- Raccourci pour "écran noir" (couper la projection sans fermer l'app) — très utile en régie
- Raccourci "image suivante / précédente"

### 5.6 Onglet Vidéos

Un second onglet de la fenêtre de contrôle, à côté de "Diapos", pour les intros de culte et boucles d'annonces :
- Même principe que les diapos : choix d'un dossier (mp4, m4v, mov, webm), grille de vignettes nommées, un clic = projection sur l'écran choisi. La vidéo démarre seule, avec son.
- Espace = lecture/pause. Flèches = vidéo suivante/précédente. B = écran noir (la vidéo se met en pause). Re-cliquer la vidéo à l'écran la relance depuis le début.
- La carte de la vidéo projetée porte deux boutons, "Boucle" (touche L) et "Muet" (touche M). Boucle : la vidéo en cours et les suivantes se rejouent sans fin tant qu'il est actif.
- Muet : coupe le son de la vidéo à l'écran et des suivantes, sans toucher au volume du système.
- Le thème (touche T) reste utilisable depuis cet onglet pour revenir à une diapo après la vidéo.
- Lecture par la balise `<video>` du WebView, sans dépendance ajoutée. Vignette = image de la vidéo à 0,5 s, sans ffmpeg.
- Les fichiers sont servis par un protocole `lsvideo://` avec requêtes Range, limité au dossier choisi (voir CLAUDE.md, Sécurité).

## 6. Flux utilisateur (workflow)

1. L'utilisateur ouvre l'application
2. Il sélectionne l'écran secondaire (projecteur/TV)
3. Il choisit le dossier contenant les images du jour
4. La barre verticale se remplit avec les vignettes + noms
5. Il clique sur une image → elle s'affiche en plein écran sur l'écran secondaire
6. Il navigue entre les images selon les besoins (clic ou clavier)
7. En fin de session, possibilité de couper l'écran (noir) ou fermer l'app

## 7. Ce que l'application NE fait PAS (pour rester légère)

Pour respecter la promesse de simplicité, l'application ne doit *pas*, du moins dans une v1 :
- Éditer ou modifier les images (pas de retouche, pas de texte superposé)
- Éditer des vidéos, gérer des playlists vidéo ou jouer de l'audio seul (la lecture de fichiers vidéo locaux, elle, est dans l'onglet "Vidéos")
- Créer des présentations à partir de zéro
- Se connecter à des bases de données de chants/Bible
- Streamer en ligne

Ces éléments peuvent être des pistes pour des versions futures (voir section 9), mais ne doivent pas alourdir le MVP.

## 8. Interface utilisateur — esquisse conceptuelle

```
ÉCRAN PRINCIPAL (contrôle)                    ÉCRAN SECONDAIRE (projection)
┌─────────────────────────────┐               ┌───────────────────────────┐
│ [Choisir dossier] [Écran ▾]  │               │                           │
├─────────────────────────────┤               │                           │
│ ┌─────────┐  slide_01.jpg   │               │                           │
│ │ [image] │                 │               │        IMAGE EN           │
│ └─────────┘                 │               │        PLEIN ÉCRAN        │
│ ┌─────────┐  slide_02.jpg   │  ── clic ──►  │                           │
│ │ [image] │  (sélectionnée) │               │                           │
│ └─────────┘                 │               │                           │
│ ┌─────────┐  slide_03.jpg   │               │                           │
│ │ [image] │                 │               │                           │
│ └─────────┘                 │               └───────────────────────────┘
│      ▼ scroll               │
└─────────────────────────────┘
```

## 9. Fonctionnalités futures possibles (v2+)

*À considérer seulement après validation du MVP :*
- Transitions douces (fondu) entre deux images
- Réorganisation manuelle de l'ordre des slides (glisser-déposer)
- Playlists / listes de lecture prédéfinies pour un événement
- Mode double-fenêtre pour prévisualiser avant d'envoyer ("preview" avant "live")
- Raccourcis clavier personnalisables
- Support multi-plateforme (Windows, macOS, Linux)

---

## 10. Choix technologique

### 10.1 Comparatif des options envisagées

| Techno | Poids | Multi-écran | Cross-platform | Courbe d'apprentissage | Verdict |
|---|---|---|---|---|---|
| **Electron** | ❌ Lourd (150-200 Mo+, Chromium embarqué) | ✅ Bonne API (`screen` module) | ✅ Win/Mac/Linux | ✅ Facile (JS/HTML/CSS) | Ironique pour un projet "anti-lourdeur" |
| **Tauri** | ✅ Très léger (~10-20 Mo) | ✅ Bonne API multi-moniteur | ✅ Win/Mac/Linux | 🟡 Moyenne (Rust backend + JS/HTML frontend) | **Choix retenu** |
| **Natif (Swift/WinUI)** | ✅✅ Ultra léger | ✅✅ Contrôle total du système | ❌ Un OS à la fois | ❌ Plus complexe, 2 codebases | Idéal si un seul OS ciblé |
| **Qt (C++/PyQt)** | 🟡 Correct (~30-50 Mo) | ✅ Très bonne gestion multi-écran | ✅ Win/Mac/Linux | 🟡 Moyenne | Solide, mais licence Qt à surveiller en usage commercial |
| **Flutter Desktop** | 🟡 Correct (~40-60 Mo) | 🟡 Support multi-fenêtre encore jeune | ✅ Win/Mac/Linux | 🟡 Moyenne (Dart) | Moins mature pour ce cas précis |

### 10.2 Stack retenue : Tauri

**Pourquoi Tauri :**

1. **Cohérence avec la vision produit** — Pas de Chromium embarqué comme Electron ; utilise le moteur web déjà présent sur l'OS (WebView2 sur Windows, WebKit sur Mac/Linux). Résultat : des apps de **10-20 Mo** au lieu de 150-200 Mo, et un démarrage quasi instantané.

2. **Frontend familier** — Interface (barre de vignettes) codée en HTML/CSS/JS, idéalement avec **Svelte** (framework léger très populaire avec Tauri, faible overhead).

3. **Backend performant** — Logique système (lecture de dossier, détection des écrans, gestion des fenêtres) en **Rust** : rapide, fiable, bonne gestion native multi-moniteur via l'API `tauri::Monitor`.

4. **Multi-fenêtre natif** — Tauri gère bien le modèle "une fenêtre de contrôle + une fenêtre de projection sur un autre écran" — exactement le besoin ici. Fenêtre sans décorations (`decorations: false`) positionnable en plein écran sur un moniteur spécifique.

5. **Cross-platform** — Un seul code pour Windows, Mac et Linux.

**Exception à considérer :** si le projet cible **uniquement macOS**, du Swift natif offrirait la meilleure performance et la plus petite taille — mais au prix du cross-platform.

### 10.3 Stack technique détaillée

| Composant | Choix |
|---|---|
| Framework applicatif | Tauri (Rust + WebView) |
| Frontend / UI | Svelte + HTML/CSS |
| Backend / logique système | Rust |
| Détection multi-écran | API `tauri::Monitor` |
| Fenêtre de projection | Fenêtre Tauri sans décorations, positionnée sur l'écran choisi, mode plein écran (kiosk) |
| Lecture d'images | Lecture asynchrone du dossier via Rust (`std::fs`) + génération de vignettes en cache pour la fluidité |
| Formats supportés (v1) | JPG, PNG (WEBP en option) |
| Poids cible de l'app | < 30 Mo |
| Plateformes cibles | Windows, macOS, Linux |

---

### Résumé en une phrase
> Une visionneuse-projecteur minimaliste : un dossier d'images, une barre de vignettes nommées à gauche/en bas, un clic = projection plein écran sur l'écran choisi — construite avec Tauri pour rester rapide et légère.

---

*Document généré comme base de discussion — à faire évoluer selon les retours et priorités.*
