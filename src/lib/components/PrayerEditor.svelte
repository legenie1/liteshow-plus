<script lang="ts">
  import { currentPrayer, selectPrayer } from "$lib/stores/projection";
  import { prayerDraft, prayerHistory } from "$lib/stores/prayer";
  import {
    addToHistory,
    canProject,
    EMPTY_PRAYER,
    nextPrayer,
    stepNumber,
  } from "$lib/prayer";
  import { t } from "$lib/i18n";
  import type { PrayerPoint } from "$lib/types";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";

  let textArea = $state<HTMLTextAreaElement>();

  const projectable = $derived(canProject($prayerDraft));
  const onScreen = $derived(
    $currentPrayer !== null &&
      JSON.stringify($currentPrayer) === JSON.stringify($prayerDraft),
  );

  function project() {
    if (!projectable) return;
    const prayer = { ...$prayerDraft };
    selectPrayer(prayer);
    prayerHistory.update((h) => addToHistory(h, prayer));
  }

  // Loads a past point back into the form (to tweak it) and puts it on screen.
  function reproject(prayer: PrayerPoint) {
    prayerDraft.set({ ...prayer });
    project();
  }

  function next() {
    prayerDraft.update(nextPrayer);
    textArea?.focus();
  }

  function clear() {
    prayerDraft.update((p) => ({
      ...EMPTY_PRAYER,
      number: p.number,
      footer: p.footer,
    }));
    textArea?.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      project();
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
      <label for="prayer-reference">{$t("prayerReference")}</label>
      <input id="prayer-reference" bind:value={$prayerDraft.reference} />
    </div>

    <div class="field">
      <label for="prayer-verse">{$t("prayerVerse")}</label>
      <textarea id="prayer-verse" rows="4" bind:value={$prayerDraft.verse}
      ></textarea>
    </div>

    <div class="field">
      <label for="prayer-footer">{$t("prayerFooter")}</label>
      <input id="prayer-footer" bind:value={$prayerDraft.footer} />
    </div>

    <div class="actions">
      <button
        class="primary"
        class:live={onScreen}
        disabled={!projectable}
        onclick={project}>{$t("prayerProject")}</button
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
    <PrayerSlide prayer={$prayerDraft} />
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
  }
</style>
