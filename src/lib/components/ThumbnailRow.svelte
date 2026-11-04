<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { enqueue } from "$lib/task-queue";
  import type { ImageFile } from "$lib/types";

  interface Props {
    image: ImageFile;
    selected: boolean;
    isTheme: boolean;
    onselect: () => void;
    ontheme: () => void;
  }

  const { image, selected, isTheme, onselect, ontheme }: Props = $props();

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

<div class="tile">
  <button bind:this={button} class="slide" class:selected onclick={onselect}>
    <span class="thumb">
      {#if thumbnail}
        <img src={thumbnail} alt="" />
      {/if}
    </span>
    <span class="name" title={image.name}>{image.name}</span>
  </button>
  <button
    class="star"
    class:on={isTheme}
    aria-pressed={isTheme}
    title={isTheme ? "Retirer le thème" : "Définir comme thème"}
    onclick={ontheme}
  >
    ★
  </button>
</div>

<style>
  .tile {
    position: relative;
  }

  .star {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    opacity: 0;
  }

  .tile:hover .star,
  .star:focus-visible,
  .star.on {
    opacity: 1;
  }

  .star:hover,
  .star.on {
    color: var(--theme);
  }

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
