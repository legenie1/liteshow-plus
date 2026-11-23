<script lang="ts">
  // The icons of a word processor's "Align" menu: an edge line (or a centre line)
  // and three bars of different lengths hanging from it.
  interface Props {
    kind: "top" | "middle" | "bottom";
  }

  const { kind }: Props = $props();

  const LENGTHS = [10, 6, 8];
  const STEPS = [3, 7.25, 11.5];
  const THICK = 2.5;

  // Bars as [x, y, width, height].
  const bars = $derived(
    LENGTHS.map((length, i): [number, number, number, number] => {
      const start =
        kind === "top"
          ? 3.5
          : kind === "bottom"
            ? 12.5 - length
            : 8 - length / 2;
      return [STEPS[i], start, THICK, length];
    }),
  );

  // The line the bars are aligned on.
  const edge = $derived<[number, number]>(
    kind === "top" ? [1, 1] : kind === "bottom" ? [1, 13.8] : [1, 7.4],
  );
</script>

<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
  <rect
    x={edge[0]}
    y={edge[1]}
    width="14"
    height="1.2"
    fill="currentColor"
    opacity={kind === "middle" ? 0.55 : 1}
  />
  {#each bars as [x, y, width, height], i (i)}
    <rect {x} {y} {width} {height} rx="0.4" fill="currentColor" />
  {/each}
</svg>
