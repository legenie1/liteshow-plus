# LiteShow — CLAUDE.md

Visionneuse-projecteur minimaliste : un dossier d'images, une barre de vignettes nommées, un clic = projection plein écran sur l'écran choisi. Voir [PROJECT.md](PROJECT.md) pour la spec complète.

**Principe directeur : faire une seule chose, et bien la faire.** Chaque décision technique se juge à l'aune de ça avant tout le reste.

## Garde-fou anti scope-creep (règle dure)

Ces éléments sont explicitement HORS SCOPE pour la v1 (PROJECT.md §7). Si une demande ou une idée pousse vers l'un de ces points, le signaler et proposer de le reporter en v2 plutôt que de l'implémenter :

- Édition/retouche d'image, texte superposé libre (seule exception : l'onglet « Prière », qui pose un point de prière sur un fond fixe, décision du 2026-11-15)
- Édition de vidéo, playlists vidéo, audio seul (la lecture de fichiers vidéo locaux dans l'onglet « Vidéos » est dans le scope, décision du 2026-11-15)
- Création de présentation from scratch
- Connexion à une base de données de chants ou à une Bible en ligne (seules exceptions : l'onglet « Bible », texte embarqué et hors ligne pour le POC, et l'onglet « Paroles », chants saisis par l'opérateur et hymnes du domaine public, décisions du 2026-11-16)
- Streaming en ligne (seule exception : la recherche d'un mot dans l'onglet « Dictionnaire », une requête ponctuelle vers une API publique, décision du 2026-11-16)

## Stack

- **Framework** : Tauri v2 (Rust + WebView, pas de Chromium embarqué)
- **Frontend** : Svelte 5 + TypeScript, via SvelteKit en mode SPA statique (`@sveltejs/adapter-static`, `ssr = false`) — c'est le template officiel `create-tauri-app`, le seul maintenu à jour pour Svelte. Pas de routing multi-pages : `src/routes/+page.svelte` reste l'unique page, ne pas ajouter de nouvelles routes.
- **Backend** : Rust, edition 2021
- **Package manager** : pnpm
- **Cibles** : Windows en priorité (poste de dev), macOS/Linux ensuite sans changement d'architecture

## Architecture

### Backend (`src-tauri/src/`)

- `commands/` — une commande Tauri par fichier/domaine :
  - `images.rs` — `list_images` (scan non récursif d'un dossier), `get_full_image` (octets bruts du fichier via `tauri::ipc::Response`, sans réencodage ni base64 : qualité originale, et un clic ne paie pas le coût JSON sur des slides de 10 Mo).
  - `thumbnails.rs` — `get_thumbnail` : génère une miniature (`image` crate, 400px max), mise en cache sur disque (app cache dir) avec une clé dérivée du chemin + mtime + taille, retournée en data URI base64.
  - `monitors.rs` — `list_monitors` (détection via `tauri::Monitor`), `open_projection_window` (crée ou repositionne la fenêtre `projection` : sans décorations, non redimensionnable, taille/position = le moniteur choisi).
  - `projection.rs` — `set_current_image`, `set_current_video`, `set_current_prayer`, `toggle_blackout`, `get_projection_state` : lisent/écrivent `AppState` et émettent l'événement `projection-changed` vers toutes les fenêtres à chaque changement. Image, vidéo et point de prière s'excluent : en choisir un efface les autres.
  - `videos.rs` — `list_videos` (scan non récursif, mp4/m4v/mov/webm, retient le dossier dans `AppState`), `toggle_video_playback` (émet `video-control` vers la fenêtre de projection) et le protocole `lsvideo://` (voir Sécurité).
- `state.rs` — `AppState { current_image, current_video, current_prayer, video_serial, video_loop, video_muted, video_folder, is_blackout }` et le type `PrayerPoint` sous `Mutex`, injecté via `tauri::State`.
- `imaging.rs` — encodage en data URI, utilisé par `thumbnails.rs`.
- `main.rs` / `lib.rs` — uniquement le bootstrap (builder Tauri, enregistrement des commandes/plugins). Aucune logique métier ici.
- Erreurs : `AppError` sérialisable (`serde::Serialize`), renvoyé en `Result<T, AppError>` depuis les commandes. Pas de `unwrap()`/`expect()` en dehors des tests.

### Frontend (`src/`)

- `routes/+page.svelte` — composition root unique. Branch au runtime sur `getCurrentWindow().label` : `"projection"` → `ProjectionView`, sinon → `ControlBar` + `ThumbnailList` + `KeyboardShortcuts`. Une seule fenêtre "control", une seule fenêtre "projection", pas de nouvelle route SvelteKit pour ça.
- `lib/components/` — `ControlBar.svelte` (choix dossier + écran + toggle écran noir), `ThumbnailList.svelte` (grille scrollable qui se réduit à une colonne en fenêtre étroite, délègue chaque case à `ThumbnailRow.svelte` qui charge sa miniature à l'approche de la zone visible, via `get_thumbnail` et la file `lib/task-queue.ts`), `ProjectionView.svelte` (rendu plein écran, fond noir par défaut, `object-fit: contain`, image ou `<video>`), `PrayerEditor.svelte` / `PrayerSlide.svelte` (onglet « Prière » : formulaire numéro + texte + référence + verset, ce dernier rempli depuis la Bible embarquée quand la référence est reconnue : `parseLooseReference` et `scriptureFor` dans `bible.ts`, jamais d'écrasement d'un verset modifié à la main, avec aperçu en direct ; `PrayerSlide` dessine la diapo en HTML/CSS sur `src/assets/background.jpg` par défaut (fond, devise et taille du texte biblique viennent des réglages, voir `SettingsMenu`), tailles en unités de conteneur `cqw` et rétrécissement automatique du texte long, devise du bas modifiable (`*…*` = accent, retenue via `localStorage`), le même composant sert l'aperçu et la projection), `VideoList.svelte` / `VideoRow.svelte` (onglet « Vidéos » : même grille que les diapos, vignette = `<video preload="metadata">` figé à 0,5 s, sans ffmpeg), `KeyboardShortcuts.svelte` (composant sans rendu, juste les raccourcis clavier de la fenêtre de contrôle).
- `lib/bible.ts` — logique pure de l'onglet « Bible » (testée dans `bible.test.ts`) : liste des 66 livres en anglais et français, `parseReference` (« Jean 3:16-18 », abréviations, préfixes), `getVerses`, `buildPassage` qui produit un `PrayerPoint` (titre = référence, ligne jaune = traductions, verset = EN puis FR) : la projection réutilise `set_current_prayer` et `PrayerSlide`, aucun code Rust ajouté. `stores/bible.ts` charge à la demande `src/assets/bible/kjv.json` et `jnd.json` (tableaux livres > chapitres > versets, via `?url` + `fetch`, ~4,5 Mo chacun, ~1,3 Mo compressés) et retient le mode EN/FR/les deux. `BibleSearch.svelte` : à gauche le champ de référence, le mode et trois listes (livres, chapitres, versets) qui ne font qu'écrire dans le champ (`parsePartial` relit le champ pour surligner la sélection) ; à droite l'aperçu. Entrée ou double-clic sur un verset = projeter, Maj+clic = plage. Surlignage : un clic sur un mot de l'aperçu le passe en jaune, Maj+clic pour un passage (`highlight.ts`, testé) ; les mots surlignés voyagent dans le texte du verset entre `⟦` et `⟧` (pas `*`, que le texte français utilise déjà), donc aucun code Rust ; un passage déjà projeté est mis à jour aussitôt, et un autre passage, une autre langue ou un autre modèle repart sans surlignage. Les réglages vivent dans `SettingsMenu.svelte` (roue dentée de la `ControlBar`, popup global) : fond de chaque type de diapo (vert, tableau noir `scripture_bg.png`, noir : `backgrounds.ts`, fonds embarqués seulement, pas d'image perso), devise du bas affichée ou non par type (désactivée pour la Bible par défaut), taille du texte biblique (`TEXT_SCALE`) et, pour la Bible, modèle de diapo (EN, FR ou les deux) (`bibleLayout` dans `stores/bible.ts`, retenu via `localStorage`), « empilé » (défaut) ou « un bloc par langue » (`PrayerPoint.passages` : une étiquette jaune « Genèse 1:16 (KJV) » puis le verset, centrés, séparés d'un filet), toujours sur `scripture_bg.png`. La loupe du champ bascule en recherche de mots (`searchVerses`, `highlightParts` dans `bible.ts` : index des versets sans accents ni majuscules construit au premier appel, ~70 ms puis < 20 ms, 100 résultats affichés) ; un résultat ne fait qu'écrire la référence, la projection reste la même.
- `lib/dictionary.ts` (+ `dictionary.test.ts`) — onglet « Dictionnaire » (POC, anglais, en ligne) : `lookupWord` interroge `https://api.dictionaryapi.dev` (sans clé, CORS ouvert, appelé depuis le frontend, aucune dépendance ni commande Rust ajoutée), `parseLookup` aplatit la réponse en liste de définitions, `buildDefinitionPassage` produit un `PrayerPoint` (titre = le mot, ligne jaune = prononciation, verset = définitions choisies) : même chemin de projection que la Bible et la Prière. Un mot inconnu (404) est un résultat normal, une panne réseau affiche un message sans rien casser ailleurs. `stores/dictionary.ts` garde mot, résultat et sélection d'un onglet à l'autre. `DictionarySearch.svelte` : Entrée cherche, Entrée une seconde fois sur le même mot projette, clic sur une définition = la mettre ou la retirer de la diapo.
- `lib/songs.ts` (+ `songs.test.ts`) — onglet « Paroles » : `parseLyrics` découpe un texte en diapos sur les lignes vides (première ligne `[Refrain]` = label de la diapo, sinon label vide : pas de numérotation automatique), `sectionKind` en déduit le type (couleur de la barre : couplet, refrain, pont), `sectionPassage` produit un `PrayerPoint` (paroles en titre, « Chant · diapo » en ligne jaune) : même chemin de projection que la Bible, la Prière et le Dictionnaire, aucun code Rust ajouté. `hymns.ts` liste les chants embarqués (**uniquement du domaine public** ; vide pour l'instant). `stores/songs.ts` garde les chants de l'opérateur dans `localStorage` (`liteshow.songs`) et la sélection d'un onglet à l'autre. `LyricsPanel.svelte` : trois colonnes (chants filtrables, diapos empilées avec numéro et barre colorée, aperçu ; sous 1000 px l'aperçu passe au-dessus des diapos) ; un clic projette la diapo, les flèches passent à la suivante/précédente ; « Ajouter un chant » ouvre un éditeur à lignes (label + paroles par diapo, Ctrl+Entrée = nouvelle ligne, dupliquer/supprimer une ligne ; `lyricsToRows`/`rowsToLyrics` le relient au texte stocké, où les diapos sont séparées par une ligne vide et nommées par une première ligne `[Nom]`) ; un chant embarqué ne se modifie pas, « Modifier une copie » en crée un à soi. Ne jamais embarquer de paroles protégées dans `hymns.ts`. Bibliothèque de l'opérateur : tout fichier `src/assets/songs/*.json` (`{ "slug-du-chant": ["ligne", …] }`) est chargé à la première ouverture de l'onglet (`stores/library.ts` : `import.meta.glob` en `?url` + `fetch`, 305 chants = ~110 Ko compressés ; sans fichier, rien ne change). `library.ts` (testé) en tire les chants : titre déduit du slug (`titleFromSlug`), lignes découpées en diapos de 4 (`LINES_PER_SLIDE`, ces fichiers n'ont pas de couplets), chants en lecture seule (« Modifier une copie »). Ces fichiers sont fournis par l'opérateur sous sa responsabilité (licence de l'église) : ne pas les publier hors de l'église. Le filtre de la liste cherche d'abord dans les titres, puis dans les paroles.
- `lib/i18n.ts` — textes de l'interface en anglais (défaut) et en français, sélecteur EN/FR dans `ControlBar`, choix retenu via `localStorage`. Un simple dictionnaire typé (`t`), pas de librairie : toute chaîne affichée passe par `$t("clé")`, avec les deux langues renseignées.
- `lib/settings.ts` (+ test) — types et valeurs par défaut des réglages de diapo, `parseSettings` tolère toute valeur absente ou inconnue. `PrayerPoint.kind` (`prayer`/`bible`/`dictionary`/`lyrics`, posé par chaque générateur de diapo, aussi côté Rust) dit à `PrayerSlide` quel réglage appliquer.
- `lib/stores/` — `settings.ts` (réglages, partagés avec la fenêtre de projection via `localStorage` et l'événement `storage`), `bible.ts` (textes, mode, requête, modèle), `images.ts` (dossier + liste d'images), `projection.ts` (image courante, blackout, fonctions `selectImage`/`toggleBlackout` qui appellent les commandes Rust), `theme.ts` (diapo du thème, une par dossier, persistée via `localStorage`, et `showTheme` qui l'affiche puis revient à la diapo interrompue), `videos.ts` (onglet actif, dossier et liste des vidéos), `prayer.ts` (brouillon du point de prière, conservé quand on change d'onglet ; la logique pure est dans `lib/prayer.ts`, testée), `monitors.ts` (liste des moniteurs, moniteur choisi, persistance via `localStorage` — pas de plugin store, `localStorage` suffit pour une seule valeur). Pas de librairie de state management externe.
- IPC : `invoke()` pour toute opération système/fs (scan dossier, thumbnails, image pleine résolution, moniteurs, gestion fenêtre, état de projection). `emit`/`listen` (événement `projection-changed`) réservés à la synchronisation fenêtre de contrôle → fenêtre de projection.

### Sécurité

- Le frontend ne lit jamais un fichier directement : toute lecture d'image passe par une commande Rust explicite (miniature : data URI base64 ; pleine résolution : octets bruts affichés via une URL `blob:`). Pas de protocole `asset://`, donc pas de scope fs à configurer ni à élargir.
- Seule exception, les vidéos (trop lourdes pour l'IPC) : le protocole custom `lsvideo://` sert des plages d'octets (Range, tranches de 4 Mo). Il ne reçoit qu'un nom de fichier, jamais un chemin, et ne lit que dans le dossier retenu par `list_videos`, avec une extension vidéo autorisée (`resolve_video`, testé). Ne pas l'élargir à autre chose.
- Windows : `lib.rs` pose `--autoplay-policy=no-user-gesture-required` (variable `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`), sinon la fenêtre de projection, qui ne reçoit jamais de clic, refuse de lancer une vidéo avec son.
- Seul appel réseau de l'app : l'onglet « Dictionnaire » envoie le mot tapé (et rien d'autre) à `api.dictionaryapi.dev` en HTTPS. Aucun fichier ni chemin local ne sort. Ne pas ajouter d'autre appel réseau sans décision explicite.
- Le dialog natif est la seule façon de choisir un dossier ; aucune saisie manuelle de chemin côté frontend.
- CSP par défaut de Tauri conservée, pas d'assouplissement sans raison documentée.

## Conventions de code

- **Rust** : `rustfmt` + `clippy` sans warning avant de considérer une tâche terminée.
- **TS/Svelte** : TypeScript strict, ESLint + Prettier + `svelte-check`.
- **Nommage fichiers** : kebab-case, sauf composants Svelte en PascalCase (`ThumbnailList.svelte`).
- **Commits** : Conventional Commits en anglais (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Langue : documentation produit/projet en français (cohérent avec PROJECT.md), code/identifiants/commentaires/commits en anglais.

## Budget

- Poids packagé cible : **< 30 Mo**.
- Aucune dépendance ajoutée sans besoin concret rattaché à une feature du MVP (voir Feuille de route). Pas de plugin Tauri installé "au cas où".

## Tests

- `cargo test` pour la logique Rust pure (scan de dossier, cache de vignettes, résolution de chemins).
- Vitest pour la logique frontend critique : la navigation clavier vit dans une fonction pure testée isolément (`src/lib/keyboard-nav.ts`), les stores qui appellent `invoke` sont testés avec `@tauri-apps/api/core` mocké (voir `src/lib/stores/projection.test.ts`). Pas de Testing Library/DOM en v1 tant que les composants restent de simples vues sans logique propre à tester.
- Pas d'e2e en v1 (trop lourd pour le scope) — une checklist de QA manuelle sert de filet à la place (voir [QA_CHECKLIST.md](QA_CHECKLIST.md)).

## Commandes utiles

```
pnpm tauri dev                                        # lancer l'app en dev
pnpm tauri build                                       # build de production
pnpm run check                                         # svelte-check + tsc
pnpm lint                                               # eslint + prettier --check
pnpm test                                               # vitest (logique frontend)
cargo clippy --manifest-path src-tauri/Cargo.toml       # lint Rust
cargo test --manifest-path src-tauri/Cargo.toml         # tests Rust
```

## Feuille de route MVP

- **Phase 1** ✅ — Sélection de dossier (plugin dialog) + listing brut des images (commande `list_images`).
- **Phase 2** ✅ — Barre de vignettes avec cache de thumbnails (commande `get_thumbnail`, data URI base64).
- **Phase 3** ✅ — Détection des moniteurs (`list_monitors`) + fenêtre de projection positionnée/kiosk (`open_projection_window`), persistance du choix via `localStorage`.
- **Phase 4** ✅ — Clic → projection instantanée (`set_current_image` + événement `projection-changed`), fond noir par défaut, image centrée sans déformation.
- **Phase 5** ✅ — Navigation clavier (flèches, next/prev) + raccourci écran noir (`toggle_blackout`, touche B).
- **Phase 6** 🟡 — Bundling Windows (NSIS/MSI) ✅ et poids ✅ vérifiés (`pnpm tauri build` : exécutable 4,9 Mo, installeur MSI 2,4 Mo, installeur NSIS 1,7 Mo — largement sous les 30 Mo cibles). Icône LiteShow ✅ (source : `src-tauri/icons/logo.svg`, à régénérer avec `pnpm tauri icon src-tauri/icons/logo.svg`). Reste à faire avant diffusion réelle : dérouler [QA_CHECKLIST.md](QA_CHECKLIST.md) avec un vrai second écran.

Ne pas anticiper les phases suivantes dans le code d'une phase donnée (pas d'abstraction "au cas où" pour une feature pas encore construite).
