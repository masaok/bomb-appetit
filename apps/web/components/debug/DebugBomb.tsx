"use client";

import {
  act,
  advance,
  generateBomb,
  hintFor,
  MODULES,
  summarize,
  type BombSpec,
  type BombState,
} from "@bombappetit/engine";
import { useEffect, useRef, useState } from "react";
import { BombNet } from "@/components/bomb/BombNet";

/** Dev-only playground: a bomb from a known seed, with each module's correct next action shown. */
export function DebugBomb({ spec }: { spec: BombSpec }) {
  const [bomb, setBomb] = useState<BombState>(() => generateBomb(spec));
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
    const loop = setInterval(
      () => setBomb((b) => advance(b, Math.round(performance.now() - startedAt.current))),
      100,
    );
    return () => clearInterval(loop);
  }, []);

  const dispatch = (m: number, a: unknown) =>
    setBomb((b) =>
      act(b, { t: Math.max(b.elapsedMs, Math.round(performance.now() - startedAt.current)), m, a }),
    );

  return (
    <div className="min-h-screen bg-[#191329] p-4 text-[#fff6e9]">
      <p className="mb-3 font-mono text-sm" data-testid="debug-summary">
        seed {spec.bombSeed} · rule {spec.ruleSeed} · {JSON.stringify(summarize(bomb))}
      </p>
      <BombNet bomb={bomb} dispatch={dispatch} />
      <h2 className="mt-6 font-display text-xl font-semibold">Correct next action per module</h2>
      <ol className="mt-2 grid gap-1 font-mono text-sm">
        {bomb.modules.map((m, i) => {
          const hint = hintFor(bomb, i);
          return (
            <li key={i} className="flex flex-wrap items-center gap-3">
              <span className="w-40 font-bold">
                {i}. {MODULES[m.id].name}
              </span>
              <span data-testid={`hint-${i}`}>
                {m.solved ? "solved" : hint === null ? "wait" : JSON.stringify(hint)}
              </span>
              {hint !== null && (
                <button
                  type="button"
                  data-testid={`do-${i}`}
                  className="rounded bg-sun px-2 py-0.5 font-bold text-night"
                  onClick={() => dispatch(i, hint)}
                >
                  do it
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
