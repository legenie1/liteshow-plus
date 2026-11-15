<script lang="ts">
  import { convertFileSrc } from "@tauri-apps/api/core";
  import type { VideoFile } from "$lib/types";

  interface Props {
    video: VideoFile;
    selected: boolean;
    onselect: () => void;
  }

  const { video, selected, onselect }: Props = $props();

  let button = $state<HTMLButtonElement>();
  let visible = $state(false);

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

  // Keyboard navigation can move past the visible part of the list.
  $effect(() => {
    if (selected) button?.scrollIntoView({ block: "nearest" });
  });
</script>

<button
  bind:this={button}
  class="slide"
  class:selected
  onclick={(event) => {
    onselect();
    // Space is the play/pause shortcut: a focused button would also "click" on it.
    event.currentTarget.blur();
  }}
>
  <span class="thumb">
    {#if visible}
      <!-- Metadata only: the webview decodes the frame at 0.5 s as the thumbnail. -->
      <video
        src="{convertFileSrc(video.name, 'lsvideo')}#t=0.5"
        preload="metadata"
        muted
        tabindex="-1"
      ></video>
    {/if}
    <span class="play" aria-hidden="true">▶</span>
  </span>
  <span class="name" title={video.name}>{video.name}</span>
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
    position: relative;
    display: block;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 6px;
    background: var(--surface);
    outline: 1px solid var(--line);
  }

  .thumb video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .play {
    position: absolute;
    right: 0.4rem;
    bottom: 0.4rem;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 0.75rem;
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
