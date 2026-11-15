<script lang="ts">
  import { videos } from "$lib/stores/videos";
  import {
    currentVideo,
    selectVideo,
    toggleVideoLoop,
    toggleVideoMute,
    videoLoop,
    videoMuted,
  } from "$lib/stores/projection";
  import VideoRow from "$lib/components/VideoRow.svelte";
  import { t } from "$lib/i18n";
</script>

{#if $videos.length === 0}
  <p class="empty">{$t("noVideos")}</p>
{:else}
  <ul class="grid">
    {#each $videos as video (video.name)}
      <li>
        <VideoRow
          {video}
          selected={$currentVideo === video.name}
          looping={$videoLoop}
          muted={$videoMuted}
          onselect={() => selectVideo(video.name)}
          ontoggleloop={toggleVideoLoop}
          ontogglemute={toggleVideoMute}
        />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    align-content: start;
    gap: 1.25rem 1rem;
    margin: 0;
    padding: 1rem;
    overflow-y: auto;
    list-style: none;
  }

  .grid li {
    min-width: 0;
  }

  .empty {
    flex: 1;
    display: grid;
    place-items: center;
    margin: 0;
    color: var(--muted);
  }
</style>
