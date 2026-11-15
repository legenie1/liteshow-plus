# LiteShow — CLAUDE.md

Visionneuse-projecteur minimaliste : un dossier d'images, une barre de vignettes nommées, un clic = projection plein écran sur l'écran choisi. Voir [PROJECT.md](PROJECT.md) pour la spec complète.

**Principe directeur : faire une seule chose, et bien la faire.** Chaque décision technique se juge à l'aune de ça avant tout le reste.

## Garde-fou anti scope-creep (règle dure)

Ces éléments sont explicitement HORS SCOPE pour la v1 (PROJECT.md §7). Si une demande ou une idée pousse vers l'un de ces points, le signaler et proposer de le reporter en v2 plutôt que de l'implémenter :

- Édition/retouche d'image, texte superposé
- Édition de vidéo, playlists vidéo, audio seul (la lecture de fichiers vidéo locaux dans l'onglet « Vidéos » est dans le scope, décision du 2026-11-15)
- Création de présentation from scratch
- Connexion à une base de données de chants/Bible
- Streaming en ligne

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
  - `projection.rs` — `set_current_image`, `set_current_video`, `toggle_blackout`, `get_projection_state` : lisent/écrivent `AppState` et émettent l'événement `projection-changed` vers toutes les fenêtres à chaque changement. Image et vidéo s'excluent : en choisir une efface l'autre.
  - `videos.rs` — `list_videos` (scan non récursif, mp4/m4v/mov/webm, retient le dossier dans `AppState`), `toggle_video_playback` (émet `video-control` vers la fenêtre de projection) et le protocole `lsvideo://` (voir Sécurité).
- `state.rs` — `AppState { current_image, current_video, video_serial, video_folder, is_blackout }` sous `Mutex`, injecté via `tauri::State`.
- `imaging.rs` — encodage en data URI, utilisé par `thumbnails.rs`.
- `main.rs` / `lib.rs` — uniquement le bootstrap (builder Tauri, enregistrement des commandes/plugins). Aucune logique métier ici.
- Erreurs : `AppError` sérialisable (`serde::Serialize`), renvoyé en `Result<T, AppError>` depuis les commandes. Pas de `unwrap()`/`expect()` en dehors des tests.

### Frontend (`src/`)

- `routes/+page.svelte` — composition root unique. Branch au runtime sur `getCurrentWindow().label` : `"projection"` → `ProjectionView`, sinon → `ControlBar` + `ThumbnailList` + `KeyboardShortcuts`. Une seule fenêtre "control", une seule fenêtre "projection", pas de nouvelle route SvelteKit pour ça.
- `lib/components/` — `ControlBar.svelte` (choix dossier + écran + toggle écran noir), `ThumbnailList.svelte` (grille scrollable qui se réduit à une colonne en fenêtre étroite, délègue chaque case à `ThumbnailRow.svelte` qui charge sa miniature à l'approche de la zone visible, via `get_thumbnail` et la file `lib/task-queue.ts`), `ProjectionView.svelte` (rendu plein écran, fond noir par défaut, `object-fit: contain`, image ou `<video>`), `VideoList.svelte` / `VideoRow.svelte` (onglet « Vidéos » : même grille que les diapos, vignette = `<video preload="metadata">` figé à 0,5 s, sans ffmpeg), `KeyboardShortcuts.svelte` (composant sans rendu, juste les raccourcis clavier de la fenêtre de contrôle).
- `lib/stores/` — `images.ts` (dossier + liste d'images), `projection.ts` (image courante, blackout, fonctions `selectImage`/`toggleBlackout` qui appellent les commandes Rust), `theme.ts` (diapo du thème, une par dossier, persistée via `localStorage`, et `showTheme` qui l'affiche puis revient à la diapo interrompue), `videos.ts` (onglet actif, dossier et liste des vidéos), `monitors.ts` (liste des moniteurs, moniteur choisi, persistance via `localStorage` — pas de plugin store, `localStorage` suffit pour une seule valeur). Pas de librairie de state management externe.
- IPC : `invoke()` pour toute opération système/fs (scan dossier, thumbnails, image pleine résolution, moniteurs, gestion fenêtre, état de projection). `emit`/`listen` (événement `projection-changed`) réservés à la synchronisation fenêtre de contrôle → fenêtre de projection.

### Sécurité

- Le frontend ne lit jamais un fichier directement : toute lecture d'image passe par une commande Rust explicite (miniature : data URI base64 ; pleine résolution : octets bruts affichés via une URL `blob:`). Pas de protocole `asset://`, donc pas de scope fs à configurer ni à élargir.
- Seule exception, les vidéos (trop lourdes pour l'IPC) : le protocole custom `lsvideo://` sert des plages d'octets (Range, tranches de 4 Mo). Il ne reçoit qu'un nom de fichier, jamais un chemin, et ne lit que dans le dossier retenu par `list_videos`, avec une extension vidéo autorisée (`resolve_video`, testé). Ne pas l'élargir à autre chose.
- Windows : `lib.rs` pose `--autoplay-policy=no-user-gesture-required` (variable `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`), sinon la fenêtre de projection, qui ne reçoit jamais de clic, refuse de lancer une vidéo avec son.
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
