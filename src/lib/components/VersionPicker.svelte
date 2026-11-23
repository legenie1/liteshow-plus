<script lang="ts">
  import type { BibleLanguage } from "$lib/bible";
  import {
    bibleMode,
    chooseTranslation,
    translationChoice,
    translations,
  } from "$lib/stores/bible";
  import { t } from "$lib/i18n";

  interface Props {
    /** Tighter rows, for the Prayer tab's form. */
    compact?: boolean;
  }

  const { compact = false }: Props = $props();

  const languages: { language: BibleLanguage; label: "bibleEn" | "bibleFr" }[] =
    [
      { language: "en", label: "bibleEn" },
      { language: "fr", label: "bibleFr" },
    ];

  // The two switches are the mode: both on is EN + FR, one on is that language
  // alone. The last one on stays on, so the slide never has nothing to show.
  const isOn = (language: BibleLanguage) =>
    $bibleMode === "both" || $bibleMode === language;

  function toggle(language: BibleLanguage) {
    const other: BibleLanguage = language === "en" ? "fr" : "en";
    if (!isOn(language)) bibleMode.set("both");
    else if ($bibleMode === "both") bibleMode.set(other);
  }

  // Choosing a version for a language that is off means wanting it back on.
  function choose(language: BibleLanguage, id: string) {
    chooseTranslation(language, id);
    if (!isOn(language)) bibleMode.set("both");
  }
</script>

<div
  class="picker"
  class:compact
  role="group"
  aria-label={$t("bibleLanguages")}
>
  {#each languages as { language, label } (language)}
    {@const on = isOn(language)}
    {@const options = translations.filter((tr) => tr.language === language)}
    <div class="row" class:off={!on}>
      <button
        class="switch"
        role="switch"
        aria-checked={on}
        onclick={() => toggle(language)}
      >
        <span class="box" aria-hidden="true">{on ? "✓" : ""}</span>
        {$t(label)}
      </button>
      <select
        aria-label={$t("bibleVersions", { language: $t(label) })}
        value={$translationChoice[language] ?? ""}
        disabled={options.length === 0}
        onchange={(event) => choose(language, event.currentTarget.value)}
      >
        {#each options as translation (translation.id)}
          <option value={translation.id}>{translation.label}</option>
        {/each}
      </select>
    </div>
  {/each}
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .switch {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.6rem;
    height: 2rem;
    padding: 0 0.7rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
  }

  .switch:hover {
    border-color: var(--muted);
  }

  .box {
    display: grid;
    flex: none;
    place-items: center;
    width: 1.05rem;
    height: 1.05rem;
    border: 1px solid var(--muted);
    border-radius: 4px;
    font-size: 0.7rem;
    line-height: 1;
  }

  .row:not(.off) .switch {
    border-color: var(--accent-line);
  }

  .row:not(.off) .box {
    border-color: var(--accent-line);
    background: var(--accent-fill);
    color: var(--accent);
  }

  .row.off .switch {
    color: var(--muted);
  }

  select {
    width: 8.5rem;
    height: 2rem;
    padding: 0 0.5rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  select:hover {
    border-color: var(--muted);
  }

  .row.off select {
    color: var(--muted);
  }

  .compact .switch,
  .compact select {
    height: 1.75rem;
    font-size: 0.8rem;
  }
</style>
