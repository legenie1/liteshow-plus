<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { enqueue } from "$lib/task-queue";
  import type { ImageFile } from "$lib/types";

  interface Props {
    image: ImageFile;
    selected: boolean;
    onselect: () => void;
  }

  const { image, selected, onselect }: Props = $props();

  let button = $state<HTMLButtonElement>();
  let visible = $state(false);
  let thumbnail = $state<string | null>(null);

  $effect(() => {
    if (!button) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          visible = true;
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(button);
    return () => observer.disconnect();
  });

  $effect(() => {
    if (!visible) return;
    let cancelled = false;
    const path = image.path;
    thumbnail = null;

    enqueue(async () => {
      if (cancelled) return;
      const dataUri = await invoke<string>("get_thumbnail", { path });
      if (!cancelled) thumbnail = dataUri;
    }).catch(() => {
      // A single unreadable/corrupt file shouldn't break the rest of the list.
    });

    return () => {
      cancelled = true;
    };
  });

  // Keyboard navigation can move past the visible part of the list.
  $effect(() => {
    if (selected) button?.scrollIntoView({ block: "nearest" });
  });
</script>

<button bind:this={button} class="slide" class:selected onclick={onselect}>
  <span class="thumb">
    {#if thumbnail}
      <img src={thumbnail} alt="" />
    {/if}
  </span>
  <span class="name" title={image.name}>{image.name}</span>
</button>

<style>
  .slide {
    display: block;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    color: var(--muted);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .thumb {
    display: block;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 6px;
    background: var(--surface);
    outline: 1px solid var(--line);
  }

  .thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .name {
    display: block;
    padding: 0.4rem 0.1rem 0;
    overflow: hidden;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .slide:hover .thumb {
    outline-color: var(--muted);
  }

  .slide:focus-visible {
    outline: none;
  }

  .slide:focus-visible .thumb {
    outline: 2px solid var(--text);
  }

  .slide.selected {
    color: var(--text);
  }

  .slide.selected .thumb {
    outline: 3px solid var(--accent);
  }
</style>
