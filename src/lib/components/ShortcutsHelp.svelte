<script lang="ts">
  import { shortcutsOpen } from "$lib/stores/shortcuts";
  import { t } from "$lib/i18n";

  const groups = [
    {
      title: "shortcutsGeneral",
      rows: [
        ["B", "shortcutBlackout"],
        ["T", "shortcutTheme"],
        ["Ctrl + 1…6", "shortcutTabs"],
        ["← ↑ → ↓", "shortcutStep"],
        ["? / F1", "shortcutHelp"],
      ],
    },
    {
      title: "shortcutsVideos",
      rows: [
        ["Enter", "shortcutProjectVideo"],
        ["Space", "shortcutPlayPause"],
        ["Shift + ← / →", "shortcutSeek"],
        ["0 / Home", "shortcutRestart"],
        ["I", "shortcutSectionStart"],
        ["O", "shortcutSectionEnd"],
        ["X", "shortcutSectionClear"],
        ["L", "shortcutLoop"],
        ["M", "shortcutMute"],
      ],
    },
    {
      title: "shortcutsText",
      rows: [
        ["Enter", "shortcutProject"],
        ["Ctrl + Enter", "shortcutQueue"],
        ["Ctrl + Shift + Enter", "shortcutQueuePrayer"],
      ],
    },
  ] as const;
</script>

{#if $shortcutsOpen}
  <div
    class="backdrop"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) shortcutsOpen.set(false);
    }}
  >
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-label={$t("shortcuts")}
      tabindex="-1"
    >
      <h2>{$t("shortcuts")}</h2>
      {#each groups as group (group.title)}
        <h3>{$t(group.title)}</h3>
        <dl>
          {#each group.rows as [keys, label] (label)}
            <dt><kbd>{keys}</kbd></dt>
            <dd>{$t(label)}</dd>
          {/each}
        </dl>
      {/each}
      <p class="hint">{$t("shortcutsClose")}</p>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.6);
  }

  .dialog {
    box-sizing: border-box;
    width: min(30rem, calc(100vw - 2rem));
    max-height: calc(100vh - 2rem);
    padding: 1rem 1.25rem;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #1e1e1e;
    font-size: 0.875rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.05rem;
  }

  h3 {
    margin: 0.9rem 0 0.3rem;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  dl {
    display: grid;
    grid-template-columns: 11rem 1fr;
    gap: 0.35rem 0.75rem;
    margin: 0;
  }

  dt,
  dd {
    margin: 0;
  }

  kbd {
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--surface);
    font: inherit;
    font-size: 0.8rem;
  }

  .hint {
    margin: 1rem 0 0;
    color: var(--muted);
    font-size: 0.8rem;
  }
</style>
