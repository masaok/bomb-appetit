"use client";

import type { BombState } from "@bombappetit/engine";
import { BombNet } from "@/components/bomb/BombNet";

// Placeholder until the 3D case lands; keeps the import graph valid.
export function Bomb3D(props: { bomb: BombState; dispatch: (moduleIndex: number, action: unknown) => void }) {
  return <BombNet {...props} />;
}
