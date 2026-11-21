<script lang="ts">
  import { bibleLayout } from "$lib/stores/bible";
  import type { BibleLayout } from "$lib/bible";
  import { t } from "$lib/i18n";

  // Global settings: one popup for the whole app, one section per kind of slide.
  // Backgrounds for the Bible, the prayers, etc. will join the sections here.
  let open = $state(false);
  let root = $state<HTMLDivElement>();

  function onWindowPointerDown(event: PointerEvent) {
    if (open && !root?.contains(event.target as Node)) open = false;
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (open && event.key === "Escape") open = false;
  }

  const layouts: {
    layout: BibleLayout;
    label: "bibleTemplateStacked" | "bibleTemplateSplit";
  }[] = [
    { layout: "stacked", label: "bibleTemplateStacked" },
    { layout: "split", label: "bibleTemplateSplit" },
  ];
</script>

<svelte:window
  onpointerdown={onWindowPointerDown}
  onkeydown={onWindowKeydown}
/>

<div class="settings" bind:this={root}>
  <button
    class="gear"
    class:active={open}
    aria-expanded={open}
    aria-label={$t("settings")}
    title={$t("settings")}
    onclick={() => (open = !open)}
  >
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
      />
    </svg>
  </button>
  {#if open}
    <div class="popup" role="dialog" aria-label={$t("settings")}>
      <section>
        <span class="section-title">{$t("settingsBible")}</span>
        <span class="field-label">{$t("bibleTemplate")}</span>
        <div class="templates">
          {#each layouts as { layout, label } (layout)}
            <button
              class="template"
              class:active={$bibleLayout === layout}
              aria-pressed={$bibleLayout === layout}
              onclick={() => bibleLayout.set(layout)}
            >
              <!-- A tiny sketch of the slide, on the scripture background. -->
              <span class="sketch {layout}">
                {#if layout === "stacked"}
                  <i class="s-title"></i>
                  <i class="s-ref"></i>
                  <i class="s-line"></i>
                  <i class="s-line short"></i>
                  <i class="s-gap"></i>
                  <i class="s-line"></i>
                  <i class="s-line short"></i>
                {:else}
                  <i class="s-pill"></i>
                  <i class="s-line"></i>
                  <i class="s-line short"></i>
                  <i class="s-rule"></i>
                  <i class="s-pill"></i>
                  <i class="s-line"></i>
                  <i class="s-line short"></i>
                {/if}
              </span>
              <span class="template-name">{$t(label)}</span>
            </button>
          {/each}
        </div>
      </section>
    </div>
  {/if}
</div>

<style>
  button {
    height: 2rem;
    padding: 0 0.75rem;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }

  button:hover {
    border-color: var(--muted);
  }

  .settings {
    position: relative;
  }

  .gear {
    display: grid;
    place-items: center;
    width: 2rem;
    padding: 0;
    color: var(--muted);
  }

  .gear:hover,
  .gear.active {
    color: var(--accent);
  }

  .popup {
    position: absolute;
    top: calc(100% + 0.4rem);
    right: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 19rem;
    padding: 0.75rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #1c1c1c;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .templates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .template {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    height: auto;
    padding: 0.35rem;
    text-align: center;
  }

  .template.active {
    border-color: var(--accent);
  }

  .template-name {
    font-size: 0.75rem;
  }

  .template.active .template-name {
    color: var(--accent);
  }

  .sketch {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    aspect-ratio: 16 / 9;
    padding: 6px 10px;
    border-radius: 3px;
    background: #222 url("../../assets/scripture_bg.png") center / cover;
  }

  .sketch.split {
    align-items: center;
  }

  .sketch i {
    display: block;
    height: 3px;
    border-radius: 1px;
    background: rgba(255, 255, 255, 0.8);
  }

  .sketch .s-title {
    width: 55%;
    height: 5px;
  }

  .sketch .s-ref {
    width: 30%;
    background: #f2b632;
  }

  .sketch .s-line {
    width: 90%;
  }

  .sketch .s-line.short {
    width: 65%;
  }

  .sketch .s-gap {
    height: 2px;
    background: transparent;
  }

  .sketch .s-pill {
    width: 40%;
    height: 5px;
    background: #f5c400;
  }

  .sketch .s-rule {
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.3);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .field-label {
    color: var(--muted);
    font-size: 0.8rem;
  }
</style>
