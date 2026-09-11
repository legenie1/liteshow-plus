# LiteShow — CLAUDE.md

Visionneuse-projecteur minimaliste : un dossier d'images, une barre de vignettes nommées, un clic = projection plein écran sur l'écran choisi. Voir [PROJECT.md](PROJECT.md) pour la spec complète.

**Principe directeur : faire une seule chose, et bien la faire.** Chaque décision technique se juge à l'aune de ça avant tout le reste.

## Garde-fou anti scope-creep (règle dure)

Ces éléments sont explicitement HORS SCOPE pour la v1 (PROJECT.md §7). Si une demande ou une idée pousse vers l'un de ces points, le signaler et proposer de le reporter en v2 plutôt que de l'implémenter :

- Édition/retouche d'image, texte superposé
- Vidéo ou audio
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

- `commands/` — une commande Tauri par fichier/domaine : scan de dossier, génération/cache de vignettes, détection des moniteurs, création/positionnement de la fenêtre de projection.
- `state.rs` — état applicatif partagé (`AppState`) sous `Mutex`/`RwLock`, injecté via `tauri::State`.
- `main.rs` / `lib.rs` — uniquement le bootstrap (builder Tauri, enregistrement des commandes/plugins). Aucune logique métier ici.
- Erreurs : type d'erreur sérialisable (`serde::Serialize`) renvoyé en `Result<T, AppError>` depuis les commandes. Pas de `unwrap()`/`expect()` en dehors des tests.
- Vignettes : générées via la crate `image`, mises en cache sur disque (app cache dir) avec une clé dérivée du chemin + mtime + taille, pour ne jamais régénérer inutilement sur un dossier déjà vu.

### Frontend (`src/`)

- `routes/+page.svelte` — composition root de la fenêtre de contrôle (unique page de l'app). N'assemble que les composants de `lib/components/`, pas de logique métier inline.
- `lib/components/` — `ControlBar.svelte` (choix dossier + écran), `ThumbnailList.svelte` (liste verticale scrollable), `ProjectionView.svelte` (rendu plein écran, fond noir par défaut, `object-fit: contain`).
- `lib/stores/` — stores Svelte : liste des images, image courante projetée, liste des moniteurs, moniteur choisi. Pas de librairie de state management externe, les stores natifs suffisent.
- IPC : `invoke()` pour toute opération système/fs (scan dossier, thumbnails, moniteurs, gestion fenêtre). `emit`/`listen` réservés à la synchronisation fenêtre de contrôle → fenêtre de projection (changement d'image, blackout).

### Sécurité

- Le périmètre fs (capabilities Tauri v2) est restreint au dossier choisi par l'utilisateur via le dialog natif. Pas d'accès fs arbitraire depuis le frontend.
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
- Vitest + Testing Library pour les stores et composants critiques (sélection d'image, navigation clavier).
- Pas d'e2e en v1 (trop lourd pour le scope) — une checklist de QA manuelle sert de filet à la place (voir Phase 6).

## Commandes utiles

```
pnpm tauri dev                                        # lancer l'app en dev
pnpm tauri build                                       # build de production
pnpm run check                                         # svelte-check + tsc
pnpm lint                                               # eslint + prettier --check
cargo clippy --manifest-path src-tauri/Cargo.toml       # lint Rust
cargo test --manifest-path src-tauri/Cargo.toml         # tests Rust
```

## Feuille de route MVP

- **Phase 1** — Sélection de dossier (plugin dialog) + listing brut des images (commande `list_images`).
- **Phase 2** — Barre de vignettes avec cache de thumbnails (commande `get_thumbnail`, `convertFileSrc`).
- **Phase 3** — Détection des moniteurs + fenêtre de projection positionnée/kiosk, persistance du choix (plugin store).
- **Phase 4** — Clic → projection instantanée, fond noir par défaut, image centrée sans déformation.
- **Phase 5** — Navigation clavier (flèches, next/prev) + raccourci écran noir.
- **Phase 6** — Polish, icône, bundling Windows (NSIS/MSI), vérification du poids (<30 Mo), checklist de QA manuelle.

Ne pas anticiper les phases suivantes dans le code d'une phase donnée (pas d'abstraction "au cas où" pour une feature pas encore construite).
