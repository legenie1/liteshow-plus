<script lang="ts">
  import { onMount, tick } from "svelte";
  import { currentPrayer, selectPrayer } from "$lib/stores/projection";
  import {
    bibleLayout,
    bibleMode,
    bibleQuery,
    loadBible,
    type BibleTexts,
  } from "$lib/stores/bible";
  import {
    BOOKS,
    buildPassage,
    completeOnKey,
    EN_VERSION,
    formatReference,
    FR_VERSION,
    highlightParts,
    parsePartial,
    parseReference,
    SEARCH_LIMIT,
    SEARCH_MIN_LETTERS,
    searchVerses,
    type BibleMode,
    type SearchHit,
  } from "$lib/bible";
  import { markPassage, markRange, toggleWord } from "$lib/highlight";
  import { snippet, type QueueItem } from "$lib/queue";
  import {
    bibleQueue,
    queueAdd,
    queueClear,
    queueMove,
    queueRemove,
  } from "$lib/stores/queue";
  import { language, t } from "$lib/i18n";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";

  // The Old Testament has 39 books; the New one starts right after.
  const NEW_TESTAMENT = 39;

  let texts = $state<BibleTexts | null>(null);
  let loadFailed = $state(false);
  let input = $state<HTMLInputElement>();
  let browser = $state<HTMLDivElement>();
  // The magnifier switches the field from "a reference" to "words to find".
  let searching = $state(false);
  let searchText = $state("");

  onMount(() => {
    input?.focus();
    loadBible().then(
      (loaded) => (texts = loaded),
      () => (loadFailed = true),
    );
  });

  const query = $derived($bibleQuery.trim());
  const reference = $derived(parseReference(query));
  const partial = $derived(parsePartial($bibleQuery));
  // Words the operator highlighted, per block of the slide, for one passage: a new
  // reference, language or template starts clean.
  const markKey = $derived(
    JSON.stringify([reference, $bibleMode, $bibleLayout]),
  );
  let marks = $state<{
    key: string;
    sets: number[][];
    anchor: { block: number; word: number } | null;
  }>({ key: "", sets: [], anchor: null });
  const currentMarks = $derived(marks.key === markKey ? marks.sets : []);
  const hasMarks = $derived(currentMarks.some((set) => set?.length));

  const plainPassage = $derived(
    reference && texts
      ? buildPassage(reference, $bibleMode, texts, $bibleLayout)
      : null,
  );
  const passage = $derived(markPassage(plainPassage, currentMarks));
  // A click on a queued slide only previews it; a double click projects it. Typing,
  // or changing the language or template, goes back to the passage being built.
  let selectedId = $state<string | null>(null);
  const selected = $derived(
    $bibleQueue.find((item) => item.id === selectedId) ?? null,
  );
  $effect(() => {
    void [$bibleQuery, $bibleMode, $bibleLayout];
    selectedId = null;
  });

  const shown = $derived(selected ? selected.passage : passage);
  const onScreen = $derived(
    shown !== null &&
      $currentPrayer !== null &&
      JSON.stringify($currentPrayer) === JSON.stringify(shown),
  );

  // The two translations number a few chapters and verses differently: offer
  // the larger of the two so nothing is unreachable.
  const chapterCount = $derived(
    texts && partial.book !== null
      ? Math.max(
          texts.en[partial.book]?.length ?? 0,
          texts.fr[partial.book]?.length ?? 0,
        )
      : 0,
  );
  const verseCount = $derived(
    texts && partial.book !== null && partial.chapter !== null
      ? Math.max(
          texts.en[partial.book]?.[partial.chapter - 1]?.length ?? 0,
          texts.fr[partial.book]?.[partial.chapter - 1]?.length ?? 0,
        )
      : 0,
  );

  const bookName = (index: number) => BOOKS[index][$language];

  const result = $derived(
    searching && texts
      ? searchVerses(texts, searchText, $bibleMode)
      : { hits: [], total: 0 },
  );
  const searchReady = $derived(
    searchText.replace(/\s/g, "").length >= SEARCH_MIN_LETTERS,
  );

  async function toggleSearch() {
    searching = !searching;
    await tick();
    input?.focus();
  }

  // A hit only fills the reference: the preview and the projection then work
  // exactly as for a typed reference, and the results stay on screen.
  function pickHit(hit: SearchHit) {
    bibleQuery.set(
      `${bookName(hit.ref.book)} ${hit.ref.chapter}:${hit.ref.from}`,
    );
  }

  const hitSelected = (hit: SearchHit) =>
    reference !== null &&
    reference.book === hit.ref.book &&
    reference.chapter === hit.ref.chapter &&
    reference.from === hit.ref.from;

  const hitKey = (hit: SearchHit) =>
    `${hit.language}:${hit.ref.book}:${hit.ref.chapter}:${hit.ref.from}`;

  function onInput(event: Event & { currentTarget: HTMLInputElement }) {
    if (searching) searchText = event.currentTarget.value;
    else bibleQuery.set(event.currentTarget.value);
  }

  // The text field stays the single source of truth: clicking only writes in it,
  // and the highlighted book, chapter and verses are read back from it.
  function pickBook(index: number) {
    bibleQuery.set(`${bookName(index)} `);
    input?.focus();
  }

  function pickChapter(chapter: number) {
    if (partial.book === null) return;
    bibleQuery.set(`${bookName(partial.book)} ${chapter}:`);
    input?.focus();
  }

  function pickVerse(verse: number, extend: boolean) {
    if (partial.book === null || partial.chapter === null) return;
    const head = `${bookName(partial.book)} ${partial.chapter}:`;
    const start = partial.from;
    bibleQuery.set(
      extend && start !== null && verse > start
        ? `${head}${start}-${verse}`
        : `${head}${verse}`,
    );
    input?.focus();
  }

  const verseSelected = (verse: number) =>
    partial.from !== null &&
    verse >= partial.from &&
    verse <= (partial.to ?? partial.from);

  // Typing "Jean 3:16" must bring those entries into view in the three lists.
  $effect(() => {
    void [partial.book, partial.chapter, partial.from, texts];
    tick().then(() => {
      for (const item of browser?.querySelectorAll(".item.active") ?? []) {
        item.scrollIntoView({ block: "nearest" });
      }
    });
  });

  const modes: {
    mode: BibleMode;
    label: "bibleEn" | "bibleFr" | "bibleBoth";
  }[] = [
    { mode: "en", label: "bibleEn" },
    { mode: "fr", label: "bibleFr" },
    { mode: "both", label: "bibleBoth" },
  ];

  // The queue keeps finished slides to come back to; the one on screen is lit.
  const isLive = (item: QueueItem) =>
    $currentPrayer !== null &&
    JSON.stringify($currentPrayer) === JSON.stringify(item.passage);

  function enqueue() {
    if (passage) queueAdd(passage);
  }

  // A click on a word highlights it (or removes it), Shift+click a whole stretch.
  // A passage already on the projector is updated at once.
  async function pickWord(block: number, word: number, shift: boolean) {
    const wasLive = onScreen;
    const sets = Array.from(currentMarks, (set) => set ?? []);
    while (sets.length <= block) sets.push([]);
    const anchor = marks.key === markKey ? marks.anchor : null;
    sets[block] =
      shift && anchor?.block === block
        ? markRange(sets[block], anchor.word, word)
        : toggleWord(sets[block], word);
    marks = { key: markKey, sets, anchor: { block, word } };
    if (wasLive) {
      await tick();
      project();
    }
  }

  async function clearMarks() {
    const wasLive = onScreen;
    marks = { key: markKey, sets: [], anchor: null };
    if (wasLive) {
      await tick();
      project();
    }
  }

  function project() {
    if (shown) selectPrayer(shown);
  }

  function onKeydown(event: KeyboardEvent) {
    if (searching) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (result.hits[0]) pickHit(result.hits[0]);
      } else if (event.key === "Escape") {
        searching = false;
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) enqueue();
      else project();
      return;
    }
    // Space or Tab moves on to the next part: book, then chapter, then verse. Only
    // when the caret is at the end, so editing the middle of the text stays
    // normal, and a Tab with nothing left to complete moves the focus on.
    if (
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !(event.shiftKey && event.key === "Tab")
    ) {
      const typed = $bibleQuery;
      if (input?.selectionStart !== typed.length) return;
      const completed = completeOnKey(typed, event.key, $language);
      if (completed !== null) {
        event.preventDefault();
        bibleQuery.set(completed);
      }
    }
  }
</script>

<div class="bible">
  <section class="left">
    <div class="field">
      <label for="bible-reference"
        >{$t(searching ? "bibleSearchLabel" : "bibleReference")}</label
      >
      <div class="searchbox">
        <input
          id="bible-reference"
          placeholder={$t(
            searching ? "bibleSearchPlaceholder" : "bibleReferencePlaceholder",
          )}
          autocomplete="off"
          spellcheck="false"
          bind:this={input}
          value={searching ? searchText : $bibleQuery}
          oninput={onInput}
          onkeydown={onKeydown}
        />
        <button
          class="search-toggle"
          class:active={searching}
          aria-pressed={searching}
          aria-label={$t("bibleSearchToggle")}
          title={$t("bibleSearchToggle")}
          onclick={toggleSearch}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle
              cx="8.5"
              cy="8.5"
              r="5.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            />
            <path
              d="M12.7 12.7 17 17"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="actions">
      <div class="modes" role="group" aria-label={$t("bibleLanguages")}>
        {#each modes as { mode, label } (mode)}
          <button
            class:active={$bibleMode === mode}
            aria-pressed={$bibleMode === mode}
            onclick={() => bibleMode.set(mode)}>{$t(label)}</button
          >
        {/each}
      </div>
      <button
        disabled={!passage}
        title={$t("bibleQueueAddHint")}
        onclick={enqueue}>{$t("bibleQueueAdd")}</button
      >
      <button
        class="primary"
        class:live={onScreen}
        disabled={!shown}
        onclick={project}>{$t("prayerProject")}</button
      >
    </div>

    {#if loadFailed}
      <p class="message error">{$t("bibleLoadError")}</p>
    {:else if !texts}
      <p class="message">{$t("bibleLoading")}</p>
    {:else if searching}
      <p class="message">
        {#if !searchReady}
          {$t("bibleSearchHint")}
        {:else if result.total === 0}
          {$t("bibleSearchNone")}
        {:else if result.total > SEARCH_LIMIT}
          {$t("bibleSearchMany", { n: result.total, max: SEARCH_LIMIT })}
        {:else}
          {$t("bibleSearchCount", { n: result.total })}
        {/if}
      </p>
    {:else if reference && !passage}
      <p class="message">{$t("bibleMissing")}</p>
    {:else if query && partial.book === null}
      <p class="message">{$t("bibleInvalid")}</p>
    {/if}

    <div class="browser" class:searching bind:this={browser}>
      {#if searching}
        <div
          class="column results"
          role="listbox"
          aria-label={$t("bibleSearchLabel")}
        >
          {#each result.hits as hit (hitKey(hit))}
            <button
              class="hit"
              class:active={hitSelected(hit)}
              role="option"
              aria-selected={hitSelected(hit)}
              onclick={() => pickHit(hit)}
              ondblclick={() => {
                pickHit(hit);
                project();
              }}
            >
              <span class="hit-ref">
                {formatReference(hit.ref, hit.language)}
                <small>{hit.language === "en" ? EN_VERSION : FR_VERSION}</small>
              </span>
              <span class="hit-text"
                >{#each highlightParts(hit.text, searchText) as part, i (i)}{#if part.match}<mark
                      >{part.text}</mark
                    >{:else}{part.text}{/if}{/each}</span
              >
            </button>
          {/each}
        </div>
      {:else}
        <div class="column books" role="listbox" aria-label={$t("bibleBooks")}>
          {#each { length: BOOKS.length }, index (index)}
            {#if index === 0 || index === NEW_TESTAMENT}
              <span class="group"
                >{$t(
                  index === 0 ? "bibleOldTestament" : "bibleNewTestament",
                )}</span
              >
            {/if}
            <button
              class="item"
              class:active={partial.book === index}
              role="option"
              aria-selected={partial.book === index}
              onclick={() => pickBook(index)}>{bookName(index)}</button
            >
          {/each}
        </div>

        <!-- Numbers sit in wrapping grids, not long lists: most chapters fit
           without scrolling, and the two grids share a single scrollbar. -->
        <div class="column numbers">
          {#if chapterCount > 0}
            <span class="group">{$t("bibleChapters")}</span>
            <div class="grid" role="listbox" aria-label={$t("bibleChapters")}>
              {#each { length: chapterCount }, i (i)}
                <button
                  class="item number"
                  class:active={partial.chapter === i + 1}
                  role="option"
                  aria-selected={partial.chapter === i + 1}
                  onclick={() => pickChapter(i + 1)}>{i + 1}</button
                >
              {/each}
            </div>
          {/if}

          {#if verseCount > 0}
            <span class="group">{$t("bibleVerses")}</span>
            <div class="grid" role="listbox" aria-label={$t("bibleVerses")}>
              {#each { length: verseCount }, i (i)}
                <button
                  class="item number"
                  class:active={verseSelected(i + 1)}
                  role="option"
                  aria-selected={verseSelected(i + 1)}
                  onclick={(event) => pickVerse(i + 1, event.shiftKey)}
                  ondblclick={project}>{i + 1}</button
                >
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </section>

  <section class="preview">
    <div class="preview-head">
      <span class="label">{$t("prayerPreview")}</span>
      {#if passage && !selected}
        <span class="label">{$t("bibleHighlightHint")}</span>
        {#if hasMarks}
          <button class="clear" onclick={clearMarks}
            >{$t("bibleHighlightClear")}</button
          >
        {/if}
      {/if}
    </div>
    <!-- The slide keeps its size however long the queue gets. -->
    <div class="stage">
      {#if shown}
        <PrayerSlide prayer={shown} onpick={selected ? undefined : pickWord} />
      {:else}
        <div class="placeholder"></div>
      {/if}
    </div>

    <div class="queue-head">
      <span class="label"
        >{$t("bibleQueueTitle", { n: $bibleQueue.length })}</span
      >
      {#if $bibleQueue.length > 0}
        <span class="label">{$t("bibleQueueHint")}</span>
        <button class="clear" onclick={queueClear}
          >{$t("bibleQueueClear")}</button
        >
      {/if}
    </div>
    {#if $bibleQueue.length === 0}
      <p class="message">{$t("bibleQueueEmpty")}</p>
    {:else}
      <ol class="queue">
        {#each $bibleQueue as item, index (item.id)}
          <li class:live={isLive(item)} class:selected={item.id === selectedId}>
            <button
              class="queue-main"
              onclick={() => (selectedId = item.id)}
              ondblclick={() => selectPrayer(item.passage)}
            >
              <span class="q-title">{item.passage.text}</span>
              <span class="q-snippet">{snippet(item.passage)}</span>
            </button>
            <button
              class="icon"
              disabled={index === 0}
              aria-label={$t("bibleQueueUp")}
              title={$t("bibleQueueUp")}
              onclick={() => queueMove(item.id, -1)}>↑</button
            >
            <button
              class="icon"
              disabled={index === $bibleQueue.length - 1}
              aria-label={$t("bibleQueueDown")}
              title={$t("bibleQueueDown")}
              onclick={() => queueMove(item.id, 1)}>↓</button
            >
            <button
              class="icon"
              aria-label={$t("bibleQueueRemove")}
              title={$t("bibleQueueRemove")}
              onclick={() => queueRemove(item.id)}>✕</button
            >
          </li>
        {/each}
      </ol>
    {/if}
  </section>
</div>

<style>
  .bible {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(19rem, 28rem) minmax(0, 1fr);
    gap: 1.25rem;
    padding: 1rem;
    overflow: hidden;
  }

  /* A narrow window stacks the two sections and scrolls instead of squeezing. */
  @media (max-width: 760px) {
    .bible {
      grid-template-columns: minmax(0, 1fr);
      grid-auto-rows: min-content;
      overflow-y: auto;
    }

    .browser {
      height: 20rem;
      flex: none;
    }
  }

  .left {
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

  label,
  .label {
    color: var(--muted);
    font-size: 0.8rem;
  }

  input,
  button {
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
  }

  .searchbox {
    position: relative;
    display: flex;
  }

  input {
    padding: 0.55rem 0.7rem;
    font-size: 1.05rem;
  }

  .searchbox input {
    flex: 1;
    min-width: 0;
    padding-right: 2.6rem;
  }

  .search-toggle {
    position: absolute;
    top: 50%;
    right: 0.3rem;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    color: var(--muted);
  }

  .search-toggle:hover,
  .search-toggle.active {
    color: var(--accent);
  }

  input:focus-visible {
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

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .modes {
    display: flex;
  }

  .modes button {
    border-radius: 0;
  }

  .modes button:first-child {
    border-radius: 6px 0 0 6px;
  }

  .modes button:not(:first-child) {
    margin-left: -1px;
  }

  .modes button:last-child {
    border-radius: 0 6px 6px 0;
  }

  .modes button.active {
    position: relative;
    border-color: var(--accent);
    color: var(--accent);
  }

  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }

  .primary.live {
    background: transparent;
    color: var(--accent);
  }

  .message {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .message.error {
    color: var(--danger);
  }

  /* Two panes: the books, and the chapter and verse grids. */
  .browser {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 0.5rem;
  }

  .browser.searching {
    grid-template-columns: minmax(0, 1fr);
  }

  .hit {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    flex: none;
    width: 100%;
    height: auto;
    padding: 0.45rem 0.55rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    text-align: left;
  }

  .hit:hover {
    background: var(--surface);
  }

  .hit.active {
    background: color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .hit-ref {
    color: var(--accent);
    font-weight: 600;
  }

  .hit-ref small {
    margin-left: 0.35rem;
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 400;
  }

  .hit-text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    color: var(--text);
    font-size: 0.85rem;
    line-height: 1.35;
  }

  mark {
    border-radius: 2px;
    background: color-mix(in srgb, var(--theme) 35%, transparent);
    color: inherit;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 0;
    padding: 0.25rem;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #1c1c1c;
    /* A thin, discreet bar that only shows its thumb. */
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  .numbers {
    gap: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(2.2rem, 1fr));
    gap: 3px;
    padding: 0 0.25rem;
  }

  .grid .item {
    height: 2rem;
    padding: 0;
  }

  .group {
    padding: 0.5rem 0.5rem 0.2rem;
    color: var(--muted);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .item {
    flex: none;
    height: 1.75rem;
    padding: 0 0.5rem;
    overflow: hidden;
    border: none;
    border-radius: 4px;
    background: transparent;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item.number {
    border: 1px solid var(--line);
    text-align: center;
  }

  .item:hover {
    background: var(--surface);
  }

  .item.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 30%, transparent);
    color: #fff;
  }

  .preview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
  }

  .preview-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 1rem;
  }

  .clear {
    height: 1.6rem;
    margin-left: auto;
    font-size: 0.8rem;
  }

  .queue-head {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .stage {
    flex: none;
  }

  /* The list takes the room left under the slide and scrolls inside it, with a
     thin bar that only shows its thumb. */
  .queue {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 3px;
    min-height: 6rem;
    margin: 0;
    padding: 0 0.25rem 0 0;
    overflow-x: hidden;
    overflow-y: auto;
    list-style: none;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  .queue li {
    flex: none;
    min-width: 0;
  }

  .queue li {
    display: flex;
    align-items: stretch;
    gap: 3px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #1c1c1c;
  }

  .queue li.selected {
    border-color: var(--muted);
  }

  .queue li.live {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .queue-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    min-width: 0;
    height: auto;
    padding: 0.35rem 0.6rem;
    border: none;
    background: transparent;
    text-align: left;
  }

  .q-title {
    color: var(--accent);
    font-weight: 600;
  }

  .q-snippet {
    max-width: 100%;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .queue .icon {
    width: 2rem;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--muted);
  }

  .queue .icon:hover:not(:disabled) {
    color: var(--text);
  }

  .placeholder {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px dashed var(--line);
    border-radius: 4px;
  }
</style>
