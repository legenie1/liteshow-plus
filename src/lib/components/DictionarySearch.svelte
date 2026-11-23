<script lang="ts">
  import { onMount } from "svelte";
  import { currentPrayer, selectPrayer } from "$lib/stores/projection";
  import {
    dictionaryLookup,
    dictionaryPicked,
    dictionaryQuery,
    dictionaryStatus,
    dictionaryWord,
  } from "$lib/stores/dictionary";
  import {
    buildDefinitionPassage,
    lookupWord,
    normalizeWord,
  } from "$lib/dictionary";
  import { t } from "$lib/i18n";
  import PrayerSlide from "$lib/components/PrayerSlide.svelte";

  const TIMEOUT_MS = 8000;

  let input = $state<HTMLInputElement>();
  let controller: AbortController | null = null;

  onMount(() => input?.focus());

  const word = $derived(normalizeWord($dictionaryQuery));
  const picked = $derived(
    $dictionaryLookup?.definitions.filter((d) =>
      $dictionaryPicked.includes(d.id),
    ) ?? [],
  );
  const passage = $derived(
    $dictionaryLookup && $dictionaryStatus === "found"
      ? buildDefinitionPassage($dictionaryLookup, picked)
      : null,
  );
  const onScreen = $derived(
    passage !== null &&
      $currentPrayer !== null &&
      JSON.stringify($currentPrayer) === JSON.stringify(passage),
  );

  async function search() {
    if (word === "") return;
    // A newer question cancels the previous one still in flight.
    controller?.abort();
    const own = new AbortController();
    controller = own;
    const timer = setTimeout(() => own.abort(), TIMEOUT_MS);
    dictionaryStatus.set("loading");
    try {
      const result = await lookupWord(word, own.signal);
      dictionaryWord.set(word);
      if (result.status === "found") {
        dictionaryLookup.set(result.lookup);
        // The first definition is what gets asked for most: ready to project.
        dictionaryPicked.set([result.lookup.definitions[0].id]);
        dictionaryStatus.set("found");
      } else {
        dictionaryLookup.set(null);
        dictionaryPicked.set([]);
        dictionaryStatus.set("notfound");
      }
    } catch {
      // Aborted by a newer search: that one reports its own outcome.
      if (controller === own) dictionaryStatus.set("error");
    } finally {
      clearTimeout(timer);
    }
  }

  function toggle(id: string) {
    dictionaryPicked.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  function project() {
    if (passage) selectPrayer(passage);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    // A second Enter on the same word projects it: type, Enter, Enter.
    const known = $dictionaryStatus === "found" && $dictionaryWord === word;
    if (known || event.ctrlKey) project();
    else search();
  }
</script>

<div class="dictionary">
  <section class="left">
    <div class="field">
      <label for="dictionary-word">{$t("dictionaryWord")}</label>
      <div class="searchbox">
        <input
          id="dictionary-word"
          placeholder={$t("dictionaryPlaceholder")}
          autocomplete="off"
          spellcheck="false"
          bind:this={input}
          bind:value={$dictionaryQuery}
          onkeydown={onKeydown}
        />
        <button
          class="search-toggle"
          aria-label={$t("dictionarySearch")}
          title={$t("dictionarySearch")}
          disabled={word === ""}
          onclick={search}
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
      <button
        class="primary"
        class:live={onScreen}
        disabled={!passage}
        onclick={project}>{$t("prayerProject")}</button
      >
    </div>

    {#if $dictionaryStatus === "loading"}
      <p class="message">{$t("dictionaryLoading")}</p>
    {:else if $dictionaryStatus === "notfound"}
      <p class="message">
        {$t("dictionaryNotFound", { word: $dictionaryWord })}
      </p>
    {:else if $dictionaryStatus === "error"}
      <p class="message error">{$t("dictionaryError")}</p>
    {/if}

    {#if $dictionaryLookup && $dictionaryStatus === "found"}
      <div class="definitions" role="group" aria-label={$t("dictionaryWord")}>
        {#each $dictionaryLookup.definitions as definition, index (definition.id)}
          {@const chosen = $dictionaryPicked.includes(definition.id)}
          <button
            class="definition"
            class:active={chosen}
            aria-pressed={chosen}
            onclick={() => toggle(definition.id)}
          >
            <span class="meta">
              {index + 1}
              {#if definition.partOfSpeech}
                <small>{definition.partOfSpeech}</small>
              {/if}
            </span>
            <span class="text">{definition.text}</span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <section class="preview">
    <span class="label">{$t("prayerPreview")}</span>
    {#if passage}
      <PrayerSlide prayer={passage} />
    {:else}
      <div class="placeholder"></div>
    {/if}
  </section>
</div>

<style>
  .dictionary {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(19rem, 28rem) minmax(0, 1fr);
    gap: 1.25rem;
    padding: 1rem;
    overflow: hidden;
  }

  @media (max-width: 760px) {
    .dictionary {
      grid-template-columns: minmax(0, 1fr);
      grid-auto-rows: min-content;
      overflow-y: auto;
    }

    .definitions {
      max-height: 20rem;
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
    flex: 1;
    min-width: 0;
    padding: 0.55rem 2.6rem 0.55rem 0.7rem;
    font-size: 1.05rem;
  }

  input:focus-visible {
    outline: 1px solid var(--accent-focus);
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

  .search-toggle {
    position: absolute;
    top: 50%;
    right: 0.3rem;
    display: grid;
    place-items: center;
    width: 2rem;
    padding: 0;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    color: var(--muted);
  }

  .search-toggle:hover:not(:disabled) {
    color: var(--accent);
  }

  .actions {
    display: flex;
  }

  .primary {
    border-color: var(--accent-line);
    background: var(--accent-fill);
    color: var(--accent);
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

  .definitions {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0.25rem;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #1c1c1c;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  .definition {
    flex: none;
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    width: 100%;
    height: auto;
    padding: 0.5rem 0.55rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    text-align: left;
  }

  .definition:hover {
    background: var(--surface);
  }

  .definition.active {
    background: var(--accent-row);
  }

  .meta {
    flex: none;
    display: flex;
    flex-direction: column;
    min-width: 3.2rem;
    color: var(--accent);
    font-weight: 600;
  }

  .meta small {
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 400;
  }

  .text {
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .preview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
    align-self: start;
  }

  .placeholder {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px dashed var(--line);
    border-radius: 4px;
  }
</style>
