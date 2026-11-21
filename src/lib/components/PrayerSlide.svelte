<script lang="ts">
  import background from "../../assets/background.jpg";
  import scriptureBackground from "../../assets/scripture_bg.png";
  import { splitFooter } from "$lib/prayer";
  import type { PrayerPoint } from "$lib/types";

  interface Props {
    prayer: PrayerPoint;
  }

  const { prayer }: Props = $props();

  let slide = $state<HTMLDivElement>();
  let content = $state<HTMLDivElement>();

  // Every size below is in container units, so the slide looks the same in the
  // preview and on the projector. Only a long text needs shrinking: `--fit` scales
  // all the text sizes until the column no longer overflows.
  function fit() {
    if (!content) return;
    let scale = 1;
    content.style.setProperty("--fit", String(scale));
    while (content.scrollHeight > content.clientHeight + 1 && scale > 0.4) {
      scale -= 0.03;
      content.style.setProperty("--fit", String(scale));
    }
  }

  // The Bible's "split" template: one labelled block per translation.
  const passages = $derived(prayer.passages ?? []);

  $effect(() => {
    // Read the fields so the effect re-runs when any of them changes.
    void [prayer.text, prayer.reference, prayer.verse, passages, content];
    fit();
  });

  $effect(() => {
    if (!slide) return;
    const observer = new ResizeObserver(fit);
    observer.observe(slide);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={slide}
  class="slide"
  class:scripture-slide={prayer.scripture}
  style:--background="url({prayer.scripture
    ? scriptureBackground
    : background})"
>
  {#if prayer.number.trim()}
    <span class="badge">{prayer.number.trim()}</span>
  {/if}

  {#if passages.length > 0}
    <div bind:this={content} class="content split">
      <!-- Auto margins centre the blocks, yet let a long text overflow downwards
           so the fit loop can measure it (centring with flex would hide the top). -->
      <div class="blocks">
        {#each passages as passage, index (index)}
          {#if index > 0}<hr />{/if}
          <span class="pill">{passage.label}</span>
          <p class="split-verse">{passage.verse.trim()}</p>
        {/each}
      </div>
    </div>
  {:else}
    <div bind:this={content} class="content">
      <p class="title">{prayer.text.trim()}</p>
      {#if prayer.reference.trim() || prayer.verse.trim()}
        <div class="scripture">
          {#if prayer.reference.trim()}
            <p class="reference">{prayer.reference.trim()}</p>
          {/if}
          {#if prayer.verse.trim()}
            <p class="verse">{prayer.verse.trim()}</p>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if prayer.footer.trim()}
    <p class="footer">
      {#each splitFooter(prayer.footer) as piece, index (index)}{#if piece.accent}<em
            >{piece.text}</em
          >{:else}{piece.text}{/if}{/each}
    </p>
  {/if}
</div>

<style>
  .slide {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    container-type: size;
    overflow: hidden;
    /* A light veil over the picture keeps white text readable on the bright rays. */
    background:
      linear-gradient(rgba(0, 12, 6, 0.32), rgba(0, 12, 6, 0.32)),
      #06140c var(--background) center / cover no-repeat;
    color: #fff;
    font-family: Bahnschrift, "Arial Narrow", "Segoe UI", sans-serif;
    font-stretch: 75%;
    text-shadow: 0 0.15cqw 0.5cqw rgba(0, 0, 0, 0.45);
  }

  /* The chalkboard is already dark: no veil. The logo sits in the top-right corner. */
  .scripture-slide {
    background: #1d1d1d var(--background) center / cover no-repeat;
  }

  .scripture-slide .content {
    right: 15cqw;
  }

  /* Split template: centred, the text clear of the logo on both sides. */
  .content.split {
    top: 8cqw;
    bottom: 6cqw;
    left: 8cqw;
    right: 8cqw;
    display: flex;
    flex-direction: column;
  }

  .blocks {
    margin: auto 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-family: "Segoe UI", Inter, Helvetica, Arial, sans-serif;
    font-stretch: normal;
  }

  .pill {
    padding: calc(0.5cqw * var(--fit, 1)) calc(2cqw * var(--fit, 1));
    border-radius: 0.6cqw;
    background: #f5c400;
    color: #1a1a1a;
    font-size: calc(2.3cqw * var(--fit, 1));
    font-weight: 800;
    text-transform: uppercase;
    text-shadow: none;
  }

  .split-verse {
    margin-top: calc(1.2cqw * var(--fit, 1));
    font-size: calc(3.1cqw * var(--fit, 1));
    font-weight: 700;
    line-height: 1.3;
  }

  hr {
    width: 100%;
    margin: calc(1.6cqw * var(--fit, 1)) 0;
    border: none;
    border-top: 0.12cqw solid rgba(255, 255, 255, 0.25);
  }

  .badge {
    position: absolute;
    left: 3.2cqw;
    top: 2.2cqw;
    display: grid;
    place-items: center;
    width: 5.6cqw;
    height: 7.8cqw;
    border-radius: 1cqw 0.3cqw 1.8cqw 1cqw;
    background: #f5b301;
    color: #3a2a00;
    font-size: 4.2cqw;
    font-weight: 800;
    text-shadow: none;
  }

  .content {
    position: absolute;
    top: 6.2cqw;
    bottom: 6.4cqw;
    left: 10.9cqw;
    right: 5cqw;
    overflow: hidden;
  }

  p {
    margin: 0;
    white-space: pre-line;
  }

  .title {
    font-size: calc(5.4cqw * var(--fit, 1));
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  .scripture {
    margin-top: calc(5cqw * var(--fit, 1));
    font-family: "Segoe UI", Inter, Helvetica, Arial, sans-serif;
    font-stretch: normal;
  }

  .reference {
    margin-bottom: calc(0.6cqw * var(--fit, 1));
    color: #f2b632;
    font-size: calc(2.7cqw * var(--fit, 1));
    font-weight: 500;
  }

  .verse {
    font-size: calc(2.85cqw * var(--fit, 1));
    line-height: 1.32;
  }

  .footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 2.4cqw;
    text-align: center;
    text-transform: uppercase;
    white-space: pre;
    font-size: 1.8cqw;
    font-weight: 800;
    text-shadow: none;
  }

  .footer em {
    color: #f5b301;
    font-size: 1.25cqw;
    font-weight: 700;
  }
</style>
