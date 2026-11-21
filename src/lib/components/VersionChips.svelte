<script lang="ts">
  import {
    bibleMode,
    chooseTranslation,
    translationChoice,
    translations,
  } from "$lib/stores/bible";
  import { t } from "$lib/i18n";

  interface Props {
    /** Smaller chips, for the Prayer tab's tighter form. */
    compact?: boolean;
  }

  const { compact = false }: Props = $props();

  // With one language on the slide, its versions are one click away. With EN + FR
  // the pair is set in the settings, so nothing shows here.
  const options = $derived(
    $bibleMode === "both"
      ? []
      : translations.filter((tr) => tr.language === $bibleMode),
  );
</script>

{#if options.length > 1}
  <div
    class="versions"
    class:compact
    role="group"
    aria-label={$t("bibleVersions")}
  >
    {#each options as translation (translation.id)}
      {@const active =
        $translationChoice[translation.language] === translation.id}
      <button
        class:active
        aria-pressed={active}
        onclick={() => chooseTranslation(translation.language, translation.id)}
        >{translation.label}</button
      >
    {/each}
  </div>
{/if}

<style>
  .versions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  button {
    height: 1.75rem;
    padding: 0 0.7rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .compact button {
    height: 1.5rem;
    padding: 0 0.55rem;
    font-size: 0.75rem;
  }

  button:hover {
    border-color: var(--muted);
  }

  button.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 25%, transparent);
    color: #fff;
  }
</style>
