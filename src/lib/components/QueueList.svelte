<script lang="ts">
  import { snippet, type QueueItem } from "$lib/queue";
  import { t } from "$lib/i18n";

  // The list of slides lined up for the service, shared by the Bible and Prayer
  // tabs. It only draws: each tab owns its queue and decides what a click does.
  interface Props {
    items: QueueItem[];
    selectedId: string | null;
    isLive: (item: QueueItem) => boolean;
    onselect: (id: string) => void;
    onproject: (item: QueueItem) => void;
    onmove: (id: string, delta: -1 | 1) => void;
    onremove: (id: string) => void;
    onclear: () => void;
  }

  const {
    items,
    selectedId,
    isLive,
    onselect,
    onproject,
    onmove,
    onremove,
    onclear,
  }: Props = $props();
</script>

<div class="box">
  <div class="head">
    <span class="label">{$t("queueTitle", { n: items.length })}</span>
    {#if items.length > 0}
      <span class="label">{$t("queueHint")}</span>
      <button class="clear" onclick={onclear}>{$t("queueClear")}</button>
    {/if}
  </div>

  {#if items.length === 0}
    <p class="empty">{$t("queueEmpty")}</p>
  {:else}
    <!-- The list scrolls inside the room it is given, with a thin bar that only
         shows its thumb. -->
    <ol class="list">
      {#each items as item, index (item.id)}
        <li class:live={isLive(item)} class:selected={item.id === selectedId}>
          <button
            class="main"
            onclick={() => onselect(item.id)}
            ondblclick={() => onproject(item)}
          >
            <span class="title">{item.passage.text}</span>
            <span class="snippet">{snippet(item.passage)}</span>
          </button>
          <button
            class="icon"
            disabled={index === 0}
            aria-label={$t("queueUp")}
            title={$t("queueUp")}
            onclick={() => onmove(item.id, -1)}>↑</button
          >
          <button
            class="icon"
            disabled={index === items.length - 1}
            aria-label={$t("queueDown")}
            title={$t("queueDown")}
            onclick={() => onmove(item.id, 1)}>↓</button
          >
          <button
            class="icon"
            aria-label={$t("queueRemove")}
            title={$t("queueRemove")}
            onclick={() => onremove(item.id)}>✕</button
          >
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  .box {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 0.3rem;
    min-height: var(--queue-min, 6rem);
    margin-top: 0.75rem;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .label,
  .empty {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
  }

  button {
    height: 2rem;
    padding: 0 0.75rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--muted);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear {
    height: 1.6rem;
    margin-left: auto;
    font-size: 0.8rem;
  }

  .list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-height: 0;
    margin: 0;
    padding: 0 0.25rem 0 0;
    overflow-x: hidden;
    overflow-y: auto;
    list-style: none;
    scrollbar-width: thin;
    scrollbar-color: #3d3d3d transparent;
  }

  li {
    display: flex;
    flex: none;
    align-items: stretch;
    gap: 3px;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: #1c1c1c;
  }

  li.selected {
    border-color: var(--muted);
  }

  li.live {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .main {
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

  .title {
    color: var(--accent);
    font-weight: 600;
  }

  .snippet {
    max-width: 100%;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon {
    width: 2rem;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--muted);
  }

  .icon:hover:not(:disabled) {
    color: var(--text);
  }
</style>
