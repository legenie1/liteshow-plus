<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { get } from "svelte/store";
  import { currentPrayer, selectPrayer } from "$lib/stores/projection";
  import {
    activeTranslations,
    bibleMode,
    loadBible,
    selectedTranslations,
  } from "$lib/stores/bible";
  import {
    completeOnKey,
    parseLooseReference,
    scriptureFor,
    type BibleTexts,
  } from "$lib/bible";
  import { prayerDraft, prayerHistory } from "$lib/stores/prayer";
  import {
    addToHistory,
    canProject,
    EMPTY_PRAYER,
    nextPrayer,
    stepNumber,
  } from "$lib/prayer";
  import { language, t } from "$lib/i18n";
  import type { BibleMode } from "$lib/translations";
  import type { PrayerPoint } from "$lib/types";
  import type { QueueItem } from "$lib/queue";
  import { prayerQueue } from "$lib/stores/queue";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";
  import VersionChips from "$lib/components/VersionChips.svelte";
  import QueueList from "$lib/components/QueueList.svelte";

  let textArea = $state<HTMLTextAreaElement>();

  // --- Verse from the Bible -------------------------------------------------
  // Typing a reference fills in the verse text and tidies the reference line.
  // Both only follow while the operator hasn't taken over: a verse or a reference
  // they changed by hand is left alone (the button below can still refill it).
  let texts = $state<BibleTexts>({});
  let autoVerse = "";
  let autoReference = "";

  // The Bible files are big: fetched the first time they are needed, then again
  // whenever another translation is chosen.
  let bibleWanted = $state(false);
  const ensureBible = () => (bibleWanted = true);
  const ready = $derived(
    $activeTranslations.length > 0 &&
      $activeTranslations.every((translation) => texts[translation.id]),
  );
  $effect(() => {
    if (!bibleWanted) return;
    const ids = $selectedTranslations.filter((id) => !texts[id]);
    if (ids.length === 0) return;
    loadBible(ids).then(
      (loaded) => (texts = { ...texts, ...loaded }),
      () => {
        // Without the files the fields simply stay manual.
      },
    );
  });

  onMount(() => {
    if ($prayerDraft.reference.trim() !== "") ensureBible();
  });

  const reference = $derived($prayerDraft.reference);
  const parsed = $derived(parseLooseReference(reference));
  const scripture = $derived(
    parsed && ready ? scriptureFor(parsed, $activeTranslations, texts) : null,
  );
  const missing = $derived(parsed !== null && ready && !scripture);
  const canFill = $derived(
    scripture !== null && $prayerDraft.verse !== scripture.verse,
  );

  $effect(() => {
    const found = scripture;
    if (!found) return;
    untrack(() => {
      const draft = get(prayerDraft);
      const verse =
        draft.verse.trim() === "" || draft.verse === autoVerse
          ? found.verse
          : draft.verse;
      // A reference the operator is still typing is not rewritten; one we wrote
      // ourselves follows the language choice.
      const reference =
        draft.reference === autoReference ? found.reference : draft.reference;
      autoVerse = found.verse;
      autoReference =
        reference === found.reference ? found.reference : autoReference;
      if (verse !== draft.verse || reference !== draft.reference) {
        prayerDraft.update((p) => ({ ...p, verse, reference }));
      }
    });
  });

  function fillVerse() {
    if (!scripture) return;
    const { verse } = scripture;
    autoVerse = verse;
    prayerDraft.update((p) => ({ ...p, verse }));
  }

  // Once the field is left, "jn 3 16" becomes "John 3:16 (KJV)".
  function tidyReference() {
    if (!scripture || $prayerDraft.reference === scripture.reference) return;
    const tidy = scripture.reference;
    autoReference = tidy;
    prayerDraft.update((p) => ({ ...p, reference: tidy }));
  }

  // Space or Tab moves on to the next part, as in the Bible tab: "john" Space,
  // "3" Space. Tab with nothing left to complete moves to the next field as usual.
  function onReferenceKeydown(
    event: KeyboardEvent & { currentTarget: HTMLInputElement },
  ) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.shiftKey && event.key === "Tab") {
      return;
    }
    const typed = $prayerDraft.reference;
    if (event.currentTarget.selectionStart !== typed.length) return;
    const completed = completeOnKey(typed, event.key, $language);
    if (completed !== null) {
      event.preventDefault();
      prayerDraft.update((p) => ({ ...p, reference: completed }));
    }
  }

  const modes: {
    mode: BibleMode;
    label: "bibleEn" | "bibleFr" | "bibleBoth";
  }[] = [
    { mode: "en", label: "bibleEn" },
    { mode: "fr", label: "bibleFr" },
    { mode: "both", label: "bibleBoth" },
  ];

  // A click on a queued point only previews it; a double click projects it. Typing
  // in the form goes back to the point being written.
  let selectedId = $state<string | null>(null);
  const selected = $derived(
    $prayerQueue.find((item) => item.id === selectedId) ?? null,
  );
  $effect(() => {
    void $prayerDraft;
    selectedId = null;
  });

  const shown = $derived(selected ? selected.passage : $prayerDraft);
  const projectable = $derived(canProject(shown));
  const queueable = $derived(canProject($prayerDraft));
  const onScreen = $derived(
    $currentPrayer !== null &&
      JSON.stringify($currentPrayer) === JSON.stringify(shown),
  );
  const isLive = (item: QueueItem) =>
    $currentPrayer !== null &&
    JSON.stringify($currentPrayer) === JSON.stringify(item.passage);

  function projectPoint(point: PrayerPoint) {
    const prayer = { ...point };
    selectPrayer(prayer);
    prayerHistory.update((h) => addToHistory(h, prayer));
  }

  function project() {
    if (projectable) projectPoint(shown);
  }

  function enqueue() {
    if (queueable) prayerQueue.add({ ...$prayerDraft });
  }

  // Loads a past point back into the form (to tweak it) and puts it on screen.
  function reproject(prayer: PrayerPoint) {
    prayerDraft.set({ ...prayer });
    projectPoint(prayer);
  }

  function next() {
    prayerDraft.update(nextPrayer);
    textArea?.focus();
  }

  function clear() {
    prayerDraft.update((p) => ({
      ...EMPTY_PRAYER,
      number: p.number,
    }));
    textArea?.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) enqueue();
      else project();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor" onkeydown={onKeydown}>
  <div class="form">
    <div class="field">
      <label for="prayer-number">{$t("prayerNumber")}</label>
      <div class="number">
        <button
          title={$t("prayerNumberLess")}
          onclick={() =>
            prayerDraft.update((p) => ({
              ...p,
              number: stepNumber(p.number, -1),
            }))}>−</button
        >
        <input
          id="prayer-number"
          inputmode="numeric"
          maxlength="4"
          bind:value={$prayerDraft.number}
        />
        <button
          title={$t("prayerNumberMore")}
          onclick={() =>
            prayerDraft.update((p) => ({
              ...p,
              number: stepNumber(p.number, 1),
            }))}>+</button
        >
      </div>
    </div>

    <div class="field">
      <label for="prayer-text">{$t("prayerText")}</label>
      <textarea
        id="prayer-text"
        rows="3"
        bind:this={textArea}
        bind:value={$prayerDraft.text}></textarea>
    </div>

    <div class="field">
      <div class="field-head">
        <label for="prayer-reference">{$t("prayerReference")}</label>
        <div class="modes" role="group" aria-label={$t("bibleLanguages")}>
          {#each modes as { mode, label } (mode)}
            <button
              class:active={$bibleMode === mode}
              aria-pressed={$bibleMode === mode}
              onclick={() => bibleMode.set(mode)}>{$t(label)}</button
            >
          {/each}
        </div>
      </div>
      <VersionChips compact />
      <input
        id="prayer-reference"
        placeholder={$t("prayerReferencePlaceholder")}
        autocomplete="off"
        spellcheck="false"
        bind:value={$prayerDraft.reference}
        onfocus={ensureBible}
        onblur={tidyReference}
        onkeydown={onReferenceKeydown}
      />
      {#if missing}
        <span class="hint">{$t("prayerReferenceMissing")}</span>
      {/if}
    </div>

    <div class="field">
      <div class="field-head">
        <label for="prayer-verse">{$t("prayerVerse")}</label>
        {#if canFill}
          <button class="link" onclick={fillVerse}
            >{$t("prayerFillVerse")}</button
          >
        {/if}
      </div>
      <textarea id="prayer-verse" rows="4" bind:value={$prayerDraft.verse}
      ></textarea>
    </div>

    <div class="actions">
      <button
        class="primary"
        class:live={onScreen}
        disabled={!projectable}
        onclick={project}>{$t("prayerProject")}</button
      >
      <button
        disabled={!queueable}
        title={$t("prayerQueueAddHint")}
        onclick={enqueue}>{$t("queueAdd")}</button
      >
      <button onclick={next}>{$t("prayerNext")}</button>
      <button onclick={clear}>{$t("prayerClear")}</button>
      <span class="hint">{$t("prayerHint")}</span>
    </div>

    {#if $prayerHistory.length > 0}
      <div class="field">
        <span class="history-label">
          {$t("prayerHistory")}
          <button class="link" onclick={() => prayerHistory.set([])}
            >{$t("prayerHistoryClear")}</button
          >
        </span>
        <div class="history">
          {#each $prayerHistory as past (past.number)}
            <button
              class="chip"
              class:live={$currentPrayer !== null &&
                $currentPrayer.number === past.number}
              title={past.text}
              onclick={() => reproject(past)}
            >
              <b>{past.number}</b>
              {past.text.trim().split("\n")[0].slice(0, 22)}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="preview">
    <span class="preview-label">{$t("prayerPreview")}</span>
    <PrayerSlide prayer={shown} />
    <QueueList
      items={$prayerQueue}
      {selectedId}
      {isLive}
      onselect={(id) => (selectedId = id)}
      onproject={(item) => projectPoint(item.passage)}
      onmove={prayerQueue.move}
      onremove={prayerQueue.remove}
      onclear={prayerQueue.clear}
    />
  </div>
</div>

<style>
  .editor {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    align-content: start;
    gap: 1.25rem;
    padding: 1rem;
    overflow-y: auto;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    min-width: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  label,
  .preview-label {
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
    padding: 0.45rem 0.6rem;
  }

  textarea {
    resize: vertical;
  }

  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }

  .number {
    display: flex;
    gap: 0.35rem;
  }

  .number input {
    width: 3.5rem;
    text-align: center;
  }

  button {
    height: 2rem;
    padding: 0 0.75rem;
    cursor: pointer;
  }

  .number button {
    width: 2rem;
    padding: 0;
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
    gap: 0.5rem;
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

  .hint {
    color: var(--muted);
    font-size: 0.75rem;
  }

  .field-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .modes {
    display: flex;
  }

  .modes button {
    height: 1.5rem;
    padding: 0 0.5rem;
    border-radius: 0;
    font-size: 0.75rem;
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

  .history-label {
    color: var(--muted);
    font-size: 0.8rem;
  }

  .history {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    max-height: 6.5rem;
    overflow-y: auto;
  }

  .link {
    height: auto;
    margin-left: 0.5rem;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
    font-size: 0.75rem;
    text-decoration: underline;
  }

  .chip {
    height: 1.6rem;
    padding: 0 0.5rem;
    font-size: 0.8rem;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .chip.live {
    border-color: var(--accent);
    color: var(--accent);
  }

  .preview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    /* The page scrolls, so the queue gets a fixed room of its own. */
    --queue-min: 12rem;
  }
</style>
