<script lang="ts">
  import { images } from "$lib/stores/images";
  import { currentImage, selectImage } from "$lib/stores/projection";
  import ThumbnailRow from "$lib/components/ThumbnailRow.svelte";
</script>

<ul class="thumbnail-list">
  {#each $images as image (image.path)}
    <li>
      <ThumbnailRow
        {image}
        selected={$currentImage === image.path}
        onselect={() => selectImage(image.path)}
      />
    </li>
  {:else}
    <li class="empty">Aucune image. Choisis un dossier pour commencer.</li>
  {/each}
</ul>

<style>
  .thumbnail-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }

  .empty {
    padding: 0.5rem 1rem;
    opacity: 0.6;
    font-size: 0.9rem;
  }
</style>
