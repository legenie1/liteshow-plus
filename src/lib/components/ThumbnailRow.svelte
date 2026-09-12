<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import type { ImageFile } from "$lib/types";

  interface Props {
    image: ImageFile;
    selected: boolean;
    onselect: () => void;
  }

  const { image, selected, onselect }: Props = $props();

  let thumbnail = $state<string | null>(null);

  $effect(() => {
    let cancelled = false;
    thumbnail = null;

    invoke<string>("get_thumbnail", { path: image.path })
      .then((dataUri) => {
        if (!cancelled) thumbnail = dataUri;
      })
      .catch(() => {
        // A single unreadable/corrupt file shouldn't break the rest of the list.
      });

    return () => {
      cancelled = true;
    };
  });
</script>

<button class="thumbnail-row" class:selected onclick={onselect}>
  <span class="thumb">
    {#if thumbnail}
      <img src={thumbnail} alt="" />
    {/if}
  </span>
  <span class="name">{image.name}</span>
</button>

<style>
  .thumbnail-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem 1rem;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 3px solid transparent;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .thumbnail-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .thumbnail-row.selected {
    border-left-color: #4c9aff;
    background: rgba(76, 154, 255, 0.12);
  }

  .thumb {
    width: 64px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111;
  }

  .thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
