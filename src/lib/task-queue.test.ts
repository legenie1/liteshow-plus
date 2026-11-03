import { describe, expect, it } from "vitest";
import { enqueue } from "./task-queue";

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

const flush = () => new Promise((r) => setTimeout(r));

describe("enqueue", () => {
  it("caps concurrency and runs the newest waiting task first", async () => {
    const started: string[] = [];
    const gates = {
      a: deferred(),
      b: deferred(),
      c: deferred(),
      d: deferred(),
    };
    const run = (name: keyof typeof gates) =>
      enqueue(() => {
        started.push(name);
        return gates[name].promise;
      });

    const all = [run("a"), run("b"), run("c"), run("d")];
    expect(started).toEqual(["a", "b"]);

    gates.a.resolve();
    await flush();
    expect(started).toEqual(["a", "b", "d"]);

    gates.b.resolve();
    gates.d.resolve();
    gates.c.resolve();
    await Promise.all(all);
    expect(started).toEqual(["a", "b", "d", "c"]);
  });

  it("keeps going after a task fails", async () => {
    await expect(
      enqueue(() => Promise.reject(new Error("bad"))),
    ).rejects.toThrow("bad");
    await expect(enqueue(() => Promise.resolve(1))).resolves.toBe(1);
  });
});
