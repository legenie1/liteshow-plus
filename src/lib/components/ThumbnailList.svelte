<script lang="ts">
  import { images } from "$lib/stores/images";
  import { currentImage, selectImage } from "$lib/stores/projection";
  import { themeImage, toggleTheme } from "$lib/stores/theme";
  import ThumbnailRow from "$lib/components/ThumbnailRow.svelte";
  import { t } from "$lib/i18n";
</script>

{#if $images.length === 0}
  <p class="empty">{$t("noImages")}</p>
{:else}
  <ul class="grid">
    {#each $images as image (image.path)}
      <li>
        <ThumbnailRow
          {image}
          selected={$currentImage === image.path}
          isTheme={$themeImage === image.path}
          onselect={() => selectImage(image.path)}
          ontheme={() => toggleTheme(image.path)}
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
    scrollbar-gutter: stable;
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
