<script lang="ts">
  import { onMount, tick } from "svelte";
  import { currentPrayer, selectPrayer } from "$lib/stores/projection";
  import { lyricsSection, lyricsSongId, userSongs } from "$lib/stores/songs";
  import { BUILT_IN_SONGS } from "$lib/hymns";
  import {
    libraryFailed,
    librarySongList,
    loadLibrary,
  } from "$lib/stores/library";
  import {
    isValidSong,
    lyricsToRows,
    matchesLyrics,
    matchesTitle,
    newSongId,
    parseLyrics,
    rowsToLyrics,
    sectionKind,
    sectionPassage,
    sortSongs,
    type Song,
  } from "$lib/songs";
  import { t } from "$lib/i18n";
  import type { QueueItem } from "$lib/queue";
  import { songQueue } from "$lib/stores/queue";
  import LiveScreen from "$lib/components/LiveScreen.svelte";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";
  import QueueList from "$lib/components/QueueList.svelte";

  /** One line of the editor; `key` keeps the row's identity when rows move. */
  interface EditorRow {
    key: number;
    label: string;
    text: string;
  }

  interface Draft {
    /** null while writing a new song (also when copying a built-in one). */
    id: string | null;
    title: string;
    rows: EditorRow[];
  }

  let rowCounter = 0;
  const newRow = (label = "", text = ""): EditorRow => ({
    key: ++rowCounter,
    label,
    text,
  });

  let filter = $state("");
  let draft = $state<Draft | null>(null);
  let confirmingDelete = $state(false);
  let slideList = $state<HTMLDivElement>();
  let editorRows = $state<HTMLDivElement>();

  // The library is only read once the tab is opened: it is a few hundred songs.
  onMount(() => {
    loadLibrary();
  });

  const songs = $derived(
    sortSongs([...BUILT_IN_SONGS, ...$librarySongList, ...$userSongs]),
  );
  // Titles first, then the songs that only have the words in their lyrics: the
  // library's titles come from file names, so a line one remembers finds the song.
  const shown = $derived(
    filter.trim() === ""
      ? songs
      : [
          ...songs.filter((song) => matchesTitle(song, filter)),
          ...songs.filter(
            (song) =>
              !matchesTitle(song, filter) && matchesLyrics(song, filter),
          ),
        ],
  );
  const selected = $derived(songs.find((s) => s.id === $lyricsSongId) ?? null);
  const sections = $derived(selected ? parseLyrics(selected.lyrics) : []);
  const passages = $derived(
    selected ? sections.map((s) => sectionPassage(selected, s)) : [],
  );
  // The preview follows the mouse over the slides, so one can be seen before it
  // is clicked (a click projects it); otherwise it shows the chosen slide.
  let hovered = $state<number | null>(null);
  const preview = $derived(passages[hovered ?? $lyricsSection ?? -1] ?? null);
  const isLive = (index: number) =>
    $currentPrayer !== null &&
    JSON.stringify($currentPrayer) === JSON.stringify(passages[index]);

  // The queue holds songs in the order of the service. A song that was deleted
  // since is left out of the list.
  const queued = $derived(
    $songQueue.filter((item) => songs.some((song) => song.id === item.id)),
  );
  const inQueue = $derived(
    selected !== null && $songQueue.some((item) => item.id === selected.id),
  );

  function enqueue() {
    if (!selected || inQueue) return;
    songQueue.add(
      {
        number: "",
        text: selected.title,
        reference: "",
        verse: sections[0]?.text ?? "",
        kind: "lyrics",
      },
      selected.id,
    );
  }

  const songOf = (item: QueueItem) =>
    songs.find((song) => song.id === item.id) ?? null;

  // A song is live when the slide on screen is one of its own.
  function queueLive(item: QueueItem): boolean {
    const song = songOf(item);
    if (!song || $currentPrayer === null) return false;
    const live = JSON.stringify($currentPrayer);
    return parseLyrics(song.lyrics).some(
      (section) => JSON.stringify(sectionPassage(song, section)) === live,
    );
  }

  function queueSelect(id: string) {
    const song = songs.find((s) => s.id === id);
    if (song) selectSong(song);
  }

  // A double click opens the song and puts its first slide on screen.
  function queueProject(item: QueueItem) {
    const song = songOf(item);
    if (!song) return;
    selectSong(song);
    const first = parseLyrics(song.lyrics)[0];
    if (!first) return;
    lyricsSection.set(0);
    selectPrayer(sectionPassage(song, first));
  }

  function selectSong(song: Song) {
    lyricsSongId.set(song.id);
    lyricsSection.set(null);
    confirmingDelete = false;
  }

  // One click puts a slide on screen: during worship there is no time for a
  // separate "project" step.
  async function projectSection(index: number) {
    const passage = passages[index];
    if (!passage) return;
    lyricsSection.set(index);
    selectPrayer(passage);
    // Moving with the arrow keys must keep the slide in view in a long song.
    await tick();
    slideList
      ?.querySelector(".slide.active")
      ?.scrollIntoView({ block: "nearest" });
  }

  async function startNew() {
    draft = { id: null, title: "", rows: [newRow()] };
    await tick();
    document.getElementById("lyrics-title")?.focus();
  }

  function startEdit(song: Song) {
    // A shipped song can't be changed: editing it saves a copy of one's own.
    const rows = lyricsToRows(song.lyrics).map((r) => newRow(r.label, r.text));
    draft = {
      id: song.builtIn ? null : song.id,
      title: song.title,
      rows: rows.length > 0 ? rows : [newRow()],
    };
    confirmingDelete = false;
  }

  const draftLyrics = $derived(draft ? rowsToLyrics(draft.rows) : "");
  const draftValid = $derived(
    draft ? isValidSong(draft.title, draftLyrics) : false,
  );

  // A new slide goes right below the current one, cursor in its lyrics, like the
  // song editor it is modelled on: Ctrl+Enter, then keep typing.
  async function addRow(after: number) {
    if (!draft) return;
    draft.rows.splice(after + 1, 0, newRow());
    await tick();
    editorRows
      ?.querySelector<HTMLTextAreaElement>(`[data-row="${after + 1}"] textarea`)
      ?.focus();
  }

  // The chorus comes back after every verse: copying it is quicker than retyping.
  function duplicateRow(index: number) {
    if (!draft) return;
    const { label, text } = draft.rows[index];
    draft.rows.splice(index + 1, 0, newRow(label, text));
  }

  function removeRow(index: number) {
    if (!draft) return;
    if (draft.rows.length === 1) draft.rows[0] = newRow();
    else draft.rows.splice(index, 1);
  }

  function onRowsKeydown(event: KeyboardEvent) {
    const index = Number(
      (event.target as HTMLElement).closest<HTMLElement>("[data-row]")?.dataset
        .row,
    );
    if (Number.isNaN(index) || event.key !== "Enter") return;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      addRow(index);
    } else if ((event.target as HTMLElement).tagName === "INPUT") {
      // Enter in a label moves on to its lyrics.
      event.preventDefault();
      editorRows
        ?.querySelector<HTMLTextAreaElement>(`[data-row="${index}"] textarea`)
        ?.focus();
    }
  }

  const kindOf = (row: EditorRow) =>
    row.label.trim() === "" ? "other" : sectionKind(row.label);

  function save() {
    if (!draft || !draftValid) return;
    const song: Song = {
      id: draft.id ?? newSongId(),
      title: draft.title.trim(),
      lyrics: draftLyrics,
      builtIn: false,
    };
    userSongs.update((all) =>
      all.some((s) => s.id === song.id)
        ? all.map((s) => (s.id === song.id ? song : s))
        : [...all, song],
    );
    lyricsSongId.set(song.id);
    lyricsSection.set(null);
    filter = "";
    draft = null;
  }

  function remove(song: Song) {
    if (!confirmingDelete) {
      confirmingDelete = true;
      return;
    }
    userSongs.update((all) => all.filter((s) => s.id !== song.id));
    lyricsSongId.set(null);
    lyricsSection.set(null);
    confirmingDelete = false;
  }

  // Arrow keys move through the slides of the song, as they do through images.
  function onWindowKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (draft || target?.closest("input, textarea, select")) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0 || passages.length === 0) return;
    event.preventDefault();
    const from = $lyricsSection ?? (delta > 0 ? -1 : passages.length);
    projectSection(Math.min(passages.length - 1, Math.max(0, from + delta)));
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="lyrics">
  <section class="songs-pane">
    <div class="field">
      <label for="lyrics-filter">{$t("lyricsSearch")}</label>
      <input
        id="lyrics-filter"
        placeholder={$t("lyricsSearchPlaceholder")}
        autocomplete="off"
        spellcheck="false"
        bind:value={filter}
      />
    </div>

    <button class="add" onclick={startNew}>{$t("lyricsAdd")}</button>

    {#if $libraryFailed}
      <p class="message error">{$t("lyricsLibraryError")}</p>
    {/if}

    <div class="songs" role="listbox" aria-label={$t("tabLyrics")}>
      {#each shown as song (song.id)}
        <button
          class="song"
          class:active={song.id === $lyricsSongId}
          role="option"
          aria-selected={song.id === $lyricsSongId}
          onclick={() => selectSong(song)}
        >
          <span class="song-title">{song.title}</span>
          {#if !song.builtIn}<small>{$t("lyricsMine")}</small>{/if}
        </button>
      {:else}
        <p class="message">
          {songs.length === 0 ? $t("lyricsEmpty") : $t("lyricsNoMatch")}
        </p>
      {/each}
    </div>

    <div class="queue-box">
      <QueueList
        items={queued}
        selectedId={$lyricsSongId}
        isLive={queueLive}
        onselect={queueSelect}
        onproject={queueProject}
        onmove={songQueue.move}
        onremove={songQueue.remove}
        onclear={songQueue.clear}
        empty={$t("lyricsQueueEmpty")}
      />
    </div>
  </section>

  {#if draft}
    <section class="editor">
      <div class="field">
        <label for="lyrics-title">{$t("lyricsTitle")}</label>
        <input id="lyrics-title" bind:value={draft.title} />
      </div>

      <!-- One row per slide, as in the song editor: a label and its lyrics.
           Ctrl+Enter adds a row below; the keys are handled once, here. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="rows" bind:this={editorRows} onkeydown={onRowsKeydown}>
        {#each draft.rows as row, index (row.key)}
          <div class="row kind-{kindOf(row)}" data-row={index}>
            <span class="num">{index + 1}</span>
            <span class="body">
              <span class="bar">
                <input
                  class="label-input"
                  placeholder={$t("lyricsLabel")}
                  aria-label={$t("lyricsLabel")}
                  autocomplete="off"
                  spellcheck="false"
                  bind:value={row.label}
                />
                <span class="row-actions">
                  <button
                    class="icon"
                    title={$t("lyricsDuplicate")}
                    aria-label={$t("lyricsDuplicate")}
                    onclick={() => duplicateRow(index)}>⧉</button
                  >
                  <button
                    class="icon"
                    title={$t("lyricsRemove")}
                    aria-label={$t("lyricsRemove")}
                    onclick={() => removeRow(index)}>×</button
                  >
                </span>
              </span>
              <textarea
                class="lines-input"
                placeholder={$t("lyricsText")}
                aria-label={$t("lyricsText")}
                bind:value={row.text}></textarea>
            </span>
          </div>
        {/each}
      </div>
      <p class="message">{$t("lyricsFormatHint")}</p>
      {#if !draftValid && (draft.title !== "" || draftLyrics !== "")}
        <p class="message error">{$t("lyricsInvalid")}</p>
      {/if}
      <div class="actions">
        <button class="primary" disabled={!draftValid} onclick={save}
          >{$t("lyricsSave")}</button
        >
        <button onclick={() => draft && addRow(draft.rows.length - 1)}
          >{$t("lyricsAddSlide")}</button
        >
        <button onclick={() => (draft = null)}>{$t("lyricsCancel")}</button>
      </div>
    </section>
  {:else if selected}
    <!-- Like a song editor: the slides stacked in order, each with a coloured
         label bar, a number, and its full lyrics. -->
    <section class="slides-pane">
      <div class="head">
        <h2 title={selected.title}>{selected.title}</h2>
        <div class="actions">
          <button
            class="plus"
            disabled={inQueue}
            aria-label={$t(inQueue ? "lyricsQueued" : "lyricsQueueAdd")}
            title={$t(inQueue ? "lyricsQueued" : "lyricsQueueAdd")}
            onclick={enqueue}>+</button
          >
          <button onclick={() => startEdit(selected)}
            >{$t(selected.builtIn ? "lyricsEditCopy" : "lyricsEdit")}</button
          >
          {#if !selected.builtIn}
            <button
              class:danger={confirmingDelete}
              onclick={() => remove(selected)}
              >{$t(
                confirmingDelete ? "lyricsDeleteConfirm" : "lyricsDelete",
              )}</button
            >
          {/if}
        </div>
      </div>

      <div
        class="slides"
        bind:this={slideList}
        role="group"
        aria-label={selected.title}
      >
        {#each sections as section, index (index)}
          <button
            class="slide kind-{section.kind}"
            class:unnamed={!section.label}
            class:active={$lyricsSection === index}
            class:live={isLive(index)}
            aria-pressed={$lyricsSection === index}
            onclick={() => projectSection(index)}
            onmouseenter={() => (hovered = index)}
            onmouseleave={() => (hovered = null)}
          >
            <span class="num">
              {index + 1}
              {#if isLive(index)}<i class="dot" title={$t("lyricsLive")}
                ></i>{/if}
            </span>
            <span class="body">
              {#if section.label}<span class="bar">{section.label}</span>{/if}
              <span class="lines">{section.text}</span>
            </span>
          </button>
        {/each}
      </div>
    </section>

    <section class="preview-pane">
      <span class="label">{$t("prayerPreview")}</span>
      <div class="stage">
        {#if preview}
          <PrayerSlide prayer={preview} />
        {:else}
          <div class="placeholder"></div>
        {/if}
      </div>

      <!-- What the projector shows right now. -->
      <span class="label live-label">{$t("live")}</span>
      <div class="stage">
        <LiveScreen />
      </div>
      <p class="message">{$t("lyricsPickHint")}</p>
    </section>
  {:else}
    <section class="empty">
      <p class="message">{$t("lyricsPick")}</p>
    </section>
  {/if}
</div>

<style>
  /* Three panes on a wide window: songs, slides, preview. Narrower, the preview
     moves above the slides; on a phone-width window everything stacks. */
  .lyrics {
    /* The preview and the live slide share the column's height: each is as wide as
       half the window's height allows (16:9). The slides take the spare width. */
    --stage-w: max(18rem, calc((100vh - 13rem) / 2 * 16 / 9));
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns:
      minmax(12rem, 16rem) minmax(17rem, 1fr)
      minmax(0, var(--stage-w));
    grid-template-areas: "songs slides preview";
    gap: 1.25rem;
    padding: 1rem;
    overflow: hidden;
  }

  .songs-pane {
    grid-area: songs;
  }

  .slides-pane {
    grid-area: slides;
  }

  .preview-pane {
    grid-area: preview;
    align-self: start;
  }

  .stage {
    width: min(100%, var(--stage-w));
  }

  /* The queue sits under the list of songs, in its own rectangle. */
  .queue-box {
    display: flex;
    flex: none;
    flex-direction: column;
    height: 14rem;
    --queue-gap: 0;
    --queue-min: 5rem;
  }

  .plus {
    width: 2rem;
    padding: 0;
    font-size: 1.25rem;
    line-height: 1;
  }

  .live-label {
    margin-top: 0.25rem;
  }

  .editor,
  .empty {
    grid-column: 2 / -1;
  }

  @media (max-width: 1000px) {
    .lyrics {
      grid-template-columns: minmax(11rem, 15rem) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
      grid-template-areas:
        "songs preview"
        "songs slides";
    }

    .songs-pane {
      grid-row: 1 / -1;
    }

    .preview-pane {
      max-width: 32rem;
    }
  }

  @media (max-width: 640px) {
    .lyrics {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
      grid-auto-rows: min-content;
      grid-template-areas:
        "songs"
        "preview"
        "slides";
      overflow-y: auto;
    }

    .songs {
      max-height: 12rem;
      flex: none;
    }

    .editor,
    .empty {
      grid-column: 1;
    }
  }

  .songs-pane,
  .slides-pane,
  .preview-pane,
  .editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
    min-height: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field.grow {
    flex: 1;
    min-height: 12rem;
  }

  label,
  .label {
    color: var(--muted);
    font-size: 0.8rem;
  }

  input,
  textarea,
  button {
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
  }

  input,
  textarea {
    padding: 0.55rem 0.7rem;
  }

  textarea {
    flex: 1;
    resize: none;
    line-height: 1.4;
  }

  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  button {
    height: 2rem;
    padding: 0 0.75rem;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--muted);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  .danger {
    border-color: var(--danger);
    color: var(--danger);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .songs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0.25rem;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #1c1c1c;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  .song {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    height: 1.9rem;
    padding: 0 0.5rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    text-align: left;
  }

  .song:hover {
    background: var(--surface);
  }

  .song.active {
    background: color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .song-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .song small {
    flex: none;
    color: var(--theme);
    font-size: 0.7rem;
  }

  .message {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .songs .message {
    padding: 0.5rem;
  }

  .message.error {
    color: var(--danger);
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 1.05rem;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* The slide list: one block per slide, scrolling on its own. */
  .slides {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-right: 0.25rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  .row {
    flex: none;
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #202020;
  }

  .row:focus-within {
    border-color: var(--accent);
  }

  .row:focus-within .num {
    background: var(--accent);
    color: #fff;
  }

  .rows {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-right: 0.25rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  /* The label is typed straight into the coloured bar. */
  .label-input {
    flex: 1;
    min-width: 0;
    padding: 0.1rem 0;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .label-input::placeholder {
    color: rgba(255, 255, 255, 0.55);
  }

  .label-input:focus-visible {
    outline: none;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  }

  .row-actions {
    display: flex;
    gap: 0.1rem;
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.95rem;
    line-height: 1;
  }

  .icon:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .lines-input {
    flex: none;
    width: 100%;
    min-height: 3.4rem;
    padding: 0.4rem 0.6rem 0.55rem;
    border: none;
    border-radius: 0;
    background: transparent;
    color: #e2e2e2;
    font-size: 0.85rem;
    line-height: 1.45;
    /* Grows with the lyrics, where the browser supports it. */
    field-sizing: content;
    resize: none;
  }

  .lines-input:focus-visible {
    outline: none;
  }

  .slide {
    flex: none;
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    height: auto;
    padding: 0;
    overflow: hidden;
    border-radius: 4px;
    background: #202020;
    text-align: left;
  }

  .num {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding-top: 0.45rem;
    background: #262626;
    color: var(--muted);
    font-size: 0.8rem;
    text-align: center;
  }

  .body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.2rem 0.6rem;
    background: #555;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .kind-verse .bar {
    background: #8a6a1c;
  }

  .kind-chorus .bar {
    background: #7a2e55;
  }

  .kind-bridge .bar {
    background: #1f6f78;
  }

  /* No label, so no bar: a thin grey edge keeps the slides visibly separate. */
  .slide.unnamed .body {
    border-top: 3px solid #555;
  }

  .lines {
    padding: 0.4rem 0.6rem 0.55rem;
    color: #e2e2e2;
    font-size: 0.85rem;
    line-height: 1.45;
    white-space: pre-line;
  }

  .slide.active {
    border-color: var(--accent);
  }

  .slide.active .num {
    background: var(--accent);
    color: #fff;
  }

  /* The slide on screen right now. */
  .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: #ff5a5f;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
  }

  .placeholder {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px dashed var(--line);
    border-radius: 4px;
  }
</style>
