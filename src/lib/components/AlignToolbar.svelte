<script lang="ts">
  import AlignIcon from "$lib/components/AlignIcon.svelte";
  import { setLyricsAlign, slideSettings } from "$lib/stores/settings";
  import { t } from "$lib/i18n";

  // The same setting as in the settings popup: this is a shortcut to it.
  const positions = [
    { value: "top", label: "alignTop" },
    { value: "center", label: "alignMiddle" },
    { value: "bottom", label: "alignBottom" },
  ] as const;
</script>

<div class="group" role="group" aria-label={$t("alignVertical")}>
  {#each positions as { value, label } (value)}
    <button
      class:active={$slideSettings.lyricsAlign === value}
      aria-pressed={$slideSettings.lyricsAlign === value}
      title={$t(label)}
      aria-label={$t(label)}
      onclick={() => setLyricsAlign(value)}
    >
      <AlignIcon kind={value === "center" ? "middle" : value} />
    </button>
  {/each}
</div>

<style>
  .group {
    display: flex;
  }

  button {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 1.75rem;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 0;
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
  }

  button:first-child {
    border-radius: 6px 0 0 6px;
  }

  button:not(:first-child) {
    margin-left: -1px;
  }

  button:last-child {
    border-radius: 0 6px 6px 0;
  }

  button:hover {
    border-color: var(--muted);
    color: var(--text);
  }

  button.active {
    position: relative;
    border-color: var(--accent-line);
    background: var(--accent-fill);
    color: var(--accent);
  }
</style>
