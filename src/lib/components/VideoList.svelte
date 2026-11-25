<script lang="ts">
  import { previewVideo, videos } from "$lib/stores/videos";
  import {
    currentVideo,
    selectVideo,
    toggleVideoLoop,
    toggleVideoMute,
    videoLoop,
    videoMuted,
  } from "$lib/stores/projection";
  import VideoRow from "$lib/components/VideoRow.svelte";
  import VideoPreview from "$lib/components/VideoPreview.svelte";
  import VideoPlayer from "$lib/components/VideoPlayer.svelte";
  import { t } from "$lib/i18n";
</script>

<div class="videos">
  {#if $videos.length === 0}
    <p class="empty">{$t("noVideos")}</p>
  {:else}
    <ul class="grid">
      {#each $videos as video (video.name)}
        <li>
          <VideoRow
            {video}
            selected={$currentVideo === video.name}
            previewed={$previewVideo === video.name}
            looping={$videoLoop}
            muted={$videoMuted}
            onselect={() => previewVideo.set(video.name)}
            onproject={() => {
              previewVideo.set(video.name);
              void selectVideo(video.name);
            }}
            ontoggleloop={toggleVideoLoop}
            ontogglemute={toggleVideoMute}
          />
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Two screens, as in the Bible and Prayer tabs: the preview (private), then
       what the projector shows. -->
  <aside class="side">
    <VideoPreview />
    <VideoPlayer />
  </aside>
</div>

<style>
  .videos {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
  }

  /* A narrow window puts the two screens under the list. */
  @media (max-width: 800px) {
    .videos {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(10rem, 1fr) minmax(0, auto);
    }

    .side {
      max-height: 55vh;
      border-top: 1px solid var(--line);
      border-left: none;
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    align-content: start;
    gap: 1.25rem 1rem;
    min-height: 0;
    margin: 0;
    padding: 1rem;
    overflow-y: auto;
    scrollbar-gutter: stable;
    list-style: none;
  }

  .grid li {
    min-width: 0;
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 0;
    padding: 0.75rem 1rem 1rem;
    overflow-y: auto;
    scrollbar-gutter: stable;
    border-left: 1px solid var(--line);
  }

  .empty {
    display: grid;
    place-items: center;
    margin: 0;
    color: var(--muted);
  }
</style>
