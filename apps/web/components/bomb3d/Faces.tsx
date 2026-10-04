"use client";

import { MODULES, type BombState, type Slot } from "@bombappetit/engine";
import { SlotView } from "@/components/bomb/BombNet";
import { FacingHtml } from "./FacingHtml";
import { DEPTH, GAP, PX_PER_UNIT, type CaseLayout, type FaceName } from "./layout";

type Dispatch = (moduleIndex: number, action: unknown) => void;

function slotName(bomb: BombState, slot: Slot): string | null {
  if (slot.kind === "timer") return "Timer";
  if (slot.kind === "empty") return null;
  const instance = bomb.modules[slot.index];
  return instance ? MODULES[instance.id].name : null;
}

function SlotCell({
  slot,
  bomb,
  dispatch,
  focused,
  onFocus,
}: {
  slot: Slot;
  bomb: BombState;
  dispatch: Dispatch;
  focused: boolean;
  onFocus: () => void;
}) {
  const name = slotName(bomb, slot);
  if (name === null) return <SlotView slot={slot} bomb={bomb} dispatch={dispatch} />;
  return (
    <div
      data-bomb-slot
      className={`relative rounded-2xl ${focused ? "outline-4 outline-offset-4 outline-sun" : ""}`}
      style={slot.kind === "timer" ? { boxShadow: "0 0 46px 10px rgba(240, 74, 58, 0.5)" } : undefined}
    >
      {/* Controls only go live once the module is focused, so a click meant to zoom in can never cut a wire. */}
      <div inert={!focused}>
        <SlotView slot={slot} bomb={bomb} dispatch={dispatch} />
      </div>
      {!focused && (
        <button
          type="button"
          aria-label={`Focus ${name}`}
          onClick={onFocus}
          className="absolute inset-0 cursor-zoom-in rounded-2xl hover:bg-[#fff6e9]/5 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-sun"
        />
      )}
    </div>
  );
}

/** Both slot grids. The back one is turned half way round so it reads correctly once the bomb is flipped. */
export function Faces({
  bomb,
  dispatch,
  layout,
  focus,
  onFocus,
}: {
  bomb: BombState;
  dispatch: Dispatch;
  layout: CaseLayout;
  focus: number | null;
  onFocus: (slotIndex: number) => void;
}) {
  const faces: { name: FaceName; first: number; z: number; turn: number }[] = [
    { name: "front", first: 0, z: DEPTH / 2 + 0.03, turn: 0 },
    { name: "back", first: layout.perFace, z: -DEPTH / 2 - 0.03, turn: Math.PI },
  ];
  return faces.map((face) => (
    <FacingHtml key={face.name} position={[0, 0, face.z]} rotation={[0, face.turn, 0]} interactive>
      <section
        aria-label={`${face.name === "front" ? "Front" : "Back"} of the bomb`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.cols}, ${PX_PER_UNIT}px)`,
          gap: GAP * PX_PER_UNIT,
        }}
      >
        {bomb.slots.slice(face.first, face.first + layout.perFace).map((slot, i) => {
          const slotIndex = face.first + i;
          return (
            <SlotCell
              key={slotIndex}
              slot={slot}
              bomb={bomb}
              dispatch={dispatch}
              focused={focus === slotIndex}
              onFocus={() => onFocus(slotIndex)}
            />
          );
        })}
      </section>
    </FacingHtml>
  ));
}
