<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { imagesFromPaths, mergeDropped } from "$lib/dropped-images";
  import { images } from "$lib/stores/images";
  import { activeTab } from "$lib/stores/videos";
  import { t } from "$lib/i18n";

  // Images dragged from anywhere (Explorer, a downloads folder, a chat app) join
  // the slides list. They are only added: nothing is projected by a drop.
  let hovering = $state(false);

  $effect(() => {
    const unlisten = getCurrentWindow().onDragDropEvent((event) => {
      const payload = event.payload;
      if (payload.type === "enter" || payload.type === "over") {
        hovering = true;
      } else if (payload.type === "leave") {
        hovering = false;
      } else if (payload.type === "drop") {
        hovering = false;
        const dropped = imagesFromPaths(payload.paths);
        if (dropped.length === 0) return;
        images.update((current) => mergeDropped(current, dropped));
        activeTab.set("slides");
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
