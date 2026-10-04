"use client";

import { CASE_SIZES, MODULES, remainingMs, timerText, type BombState, type Slot } from "@bombappetit/engine";
import { ModuleFace } from "@/components/modules/faces";
import type { BombReadout } from "@/components/modules/types";
import { EdgeworkStrip } from "./Edgework";
import { ModuleFrame, type FrameStatus } from "./ModuleFrame";
import { TimerFace } from "./TimerFace";

const STRIKE_FLASH_MS = 600;

export function readoutOf(bomb: BombState): BombReadout {
  return { elapsedMs: bomb.elapsedMs, strikes: bomb.strikes, timerText: timerText(remainingMs(bomb)) };
}

export function moduleStatus(bomb: BombState, index: number): FrameStatus {
  const instance = bomb.modules[index];
  if (!instance) return "idle";
  if (instance.solved) return "solved";
  const lastStrike = bomb.strikeLog.findLast((s) => s.moduleIndex === index);
  if (lastStrike && bomb.elapsedMs - lastStrike.atMs < STRIKE_FLASH_MS) return "struck";
  return MODULES[instance.id].kind === "needy" ? "needy" : "idle";
}

/** One slot of the case: the timer, a module, or a blank plate. Shared by the 2D and 3D views. */
export function SlotView({
  slot,
  bomb,
  dispatch,
}: {
  slot: Slot;
  bomb: BombState;
  dispatch: (moduleIndex: number, action: unknown) => void;
}) {
  const readout = readoutOf(bomb);
  if (slot.kind === "timer") {
    return (
      <ModuleFrame label="Timer" status="idle">
        <TimerFace timerText={readout.timerText} strikes={bomb.strikes} strikeLimit={bomb.spec.strikeLimit} />
      </ModuleFrame>
    );
  }
  if (slot.kind === "empty") {
    return (
      <div
        aria-hidden
        className="aspect-square rounded-2xl border-2 border-[#15101f] bg-[#231b3b] opacity-60"
      />
    );
  }
  const instance = bomb.modules[slot.index];
  if (!instance) return null;
  const live = bomb.phase.kind === "armed" && !instance.solved;
  return (
    <ModuleFrame label={MODULES[instance.id].name} status={moduleStatus(bomb, slot.index)} inert={!live}>
      <ModuleFace instance={instance} bomb={readout} dispatch={(action) => dispatch(slot.index, action)} />
    </ModuleFrame>
  );
}

/** The flat "case net": front face, back face and the edgework, all visible at once. */
export function BombNet({
  bomb,
  dispatch,
}: {
  bomb: BombState;
  dispatch: (moduleIndex: number, action: unknown) => void;
}) {
  const { cols, rows } = CASE_SIZES[bomb.spec.caseSize];
  const perFace = cols * rows;
  // Blank plates only matter in 3D. Here, keep whole rows up to the last used slot.
  const usedRows = (slots: Slot[]) => {
    const last = slots.findLastIndex((slot) => slot.kind !== "empty");
    return slots.slice(0, Math.ceil((last + 1) / cols) * cols);
  };
  const faces = [
    { name: "Front", slots: usedRows(bomb.slots.slice(0, perFace)) },
    { name: "Back", slots: usedRows(bomb.slots.slice(perFace)) },
  ].filter((face) => face.slots.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <EdgeworkStrip edgework={bomb.edgework} />
      {faces.map((face) => (
        <section
          key={face.name}
          aria-label={`${face.name} of the bomb`}
          className="rounded-3xl border-2 border-[#15101f] bg-[#3a2f5c] p-3"
        >
          <h2 className="mb-2 px-1 font-display text-sm font-semibold tracking-widest text-[#b9b0d0] uppercase">
            {face.name}
          </h2>
          <div
            className={`grid gap-3 ${cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}
          >
            {face.slots.map((slot, i) => (
              <SlotView key={i} slot={slot} bomb={bomb} dispatch={dispatch} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
