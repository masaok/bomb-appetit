/**
 * Seeded randomness. The same key always yields the same stream on every device,
 * which is what makes bombs, manuals and replays reproducible.
 */
export interface Rng {
  /** The key this stream was derived from. Store it to re-derive forks later. */
  readonly key: string;
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  bool(probability?: number): boolean;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  sample<T>(items: readonly T[], count: number): T[];
  /**
   * An independent stream derived from this stream's key and `label`, not from how
   * many numbers were already drawn. Adding a draw in one place never shifts another.
   */
  fork(label: string): Rng;
}

function hashKey(key: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < key.length; i++) {
    const k = key.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

export function createRng(seed: number | string): Rng {
  const key = String(seed);
  let [a, b, c, d] = hashKey(key);

  // sfc32
  const next = () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  };

  return {
    key,
    next,
    int,
    bool: (probability = 0.5) => next() < probability,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error("Rng.pick on an empty list");
      return items[int(0, items.length - 1)] as T;
    },
    shuffle,
    sample: <T>(items: readonly T[], count: number): T[] => shuffle(items).slice(0, count),
    fork: (label: string) => createRng(`${key}/${label}`),
  };
}
