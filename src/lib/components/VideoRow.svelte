<script lang="ts">
  import { convertFileSrc } from "@tauri-apps/api/core";
  import { t } from "$lib/i18n";
  import type { VideoFile } from "$lib/types";

  interface Props {
    video: VideoFile;
    /** On the projector. */
    selected: boolean;
    /** In the preview, not necessarily projected. */
    previewed: boolean;
    looping: boolean;
    muted: boolean;
    onselect: () => void;
    onproject: () => void;
    ontoggleloop: () => void;
    ontogglemute: () => void;
  }

  const {
    video,
    selected,
    previewed,
    looping,
    muted,
    onselect,
    onproject,
    ontoggleloop,
    ontogglemute,
  }: Props = $props();

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

  // Space is the play/pause shortcut: a focused button would also "click" on it.
  function then(action: () => void) {
    return (event: MouseEvent) => {
      action();
      (event.currentTarget as HTMLElement).blur();
    };
  }
</script>

<div class="tile">
  <button
    bind:this={button}
    class="slide"
    class:selected
    class:previewed
    onclick={then(onselect)}
    ondblclick={then(onproject)}
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
      {#if !selected}
        <span class="play" aria-hidden="true">▶</span>
      {/if}
    </span>
    <span class="name" title={video.name}>{video.name}</span>
  </button>

  {#if selected}
    <div class="options">
      <button
        class="option"
        class:on={looping}
        aria-pressed={looping}
        title={$t("loopTitle")}
        onclick={then(ontoggleloop)}
      >
        ⟲ {$t("loop")}
      </button>
      <button
        class="option"
        class:on={muted}
        aria-pressed={muted}
        title={$t("muteTitle")}
        onclick={then(ontogglemute)}
      >
        {$t("mute")}
      </button>
    </div>
  {/if}
</div>

<style>
  .tile {
    position: relative;
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

  /* Over the thumbnail, but a sibling of the slide button: buttons can't nest. */
  .options {
    position: absolute;
    right: 0.4rem;
    /* The name line (~1.6rem) sits under the thumbnail. */
    bottom: 2.2rem;
    display: flex;
    gap: 0.35rem;
  }

  .option {
    height: 1.75rem;
    padding: 0 0.6rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .option:hover {
    border-color: var(--muted);
  }

  .option.on {
    border-color: var(--accent-line);
    background: var(--accent-fill);
    color: var(--accent);
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

  .slide.previewed .thumb {
    outline: 2px solid var(--accent-focus);
  }

  .slide.selected,
  .slide.previewed {
    color: var(--text);
  }

  .slide.selected .thumb {
    outline: 2px solid var(--accent-strong);
  }
</style>
