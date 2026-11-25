<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { invoke } from "@tauri-apps/api/core";
  import {
    imagesFromPaths,
    mergeDropped,
    mergeVideos,
    videoPathsFrom,
  } from "$lib/dropped-images";
  import { images } from "$lib/stores/images";
  import { activeTab, videos } from "$lib/stores/videos";
  import type { VideoFile } from "$lib/types";
  import { t } from "$lib/i18n";

  // Images and videos dragged from anywhere (Explorer, a downloads folder, a chat
  // app) join the slides or videos list. They are only added: nothing is
  // projected by a drop.
  let hovering = $state(false);

  async function addDropped(paths: string[]) {
    const pictures = imagesFromPaths(paths);
    if (pictures.length > 0) {
      images.update((current) => mergeDropped(current, pictures));
    }

    const videoPaths = videoPathsFrom(paths);
    let clips: VideoFile[] = [];
    if (videoPaths.length > 0) {
      try {
        // Rust checks the files and gives each a name the video protocol can serve.
        clips = await invoke<VideoFile[]>("add_videos", { paths: videoPaths });
        videos.update((current) => mergeVideos(current, clips));
      } catch {
        // A refused drop adds nothing; the lists are unchanged.
      }
    }

    // Stay on the current tab when it already shows what was dropped.
    if (clips.length > 0 && pictures.length === 0) activeTab.set("videos");
    else if (pictures.length > 0 && clips.length === 0) activeTab.set("slides");
  }

  $effect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      const payload = event.payload;
      if (payload.type === "enter" || payload.type === "over") {
        hovering = true;
      } else if (payload.type === "leave") {
        hovering = false;
      } else if (payload.type === "drop") {
        hovering = false;
        void addDropped(payload.paths);
      }
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  });
</script>

{#if hovering}
  <div class="overlay" aria-hidden="true">
    <span>{$t("dropImages")}</span>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--accent) 8%, rgb(0 0 0 / 70%));
    border: 2px dashed var(--accent-focus);
    pointer-events: none;
  }

  span {
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--accent-line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-size: 1rem;
  }
</style>
