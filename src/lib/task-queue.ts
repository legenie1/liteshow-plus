// Decoding is blocking work on the backend's async workers. Capping it leaves a
// worker free, so a click on a slide never waits behind a folder of thumbnails.
const MAX_CONCURRENT = 2;

let active = 0;
const waiting: (() => void)[] = [];

function next() {
  if (active >= MAX_CONCURRENT) return;
  // Last in, first out: the rows just scrolled into view are the ones to load.
  waiting.pop()?.();
}

export function enqueue<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    waiting.push(() => {
      active++;
      task()
        .then(resolve, reject)
        .finally(() => {
          active--;
          next();
        });
    });
    next();
  });
}
