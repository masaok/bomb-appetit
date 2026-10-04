import type { DialAlignmentDirection, DialAlignmentRules } from "@bombappetit/engine/modules/dial-alignment";
import { ManualLead, ManualTable } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

const COLUMNS = 6;

const ARROW_TURNS: Record<DialAlignmentDirection, number> = { up: 0, right: 90, down: 180, left: 270 };

function Lights({ leds }: { leds: boolean[] }) {
  const lit = leds.filter(Boolean).length;
  return (
    <svg
      viewBox={`0 0 ${COLUMNS * 16 + 4} 36`}
      className="h-10"
      role="img"
      aria-label={`Two rows of lights, ${lit} lit: ${leds.map((on) => (on ? "on" : "off")).join(", ")}`}
    >
      {leds.map((on, i) => (
        <circle
          key={i}
          cx={10 + (i % COLUMNS) * 16}
          cy={10 + Math.floor(i / COLUMNS) * 16}
          r="5.5"
          fill={on ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function Direction({ direction }: { direction: DialAlignmentDirection }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold whitespace-nowrap">
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
        <path
          d="M10 17V4M4 9l6-6 6 6"
          transform={`rotate(${ARROW_TURNS[direction]} 10 10)`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {direction}
    </span>
  );
}

export function Manual({ rules }: ModuleManualProps<DialAlignmentRules>) {
  return (
    <>
      <ManualLead>
        This module cannot be solved. It sleeps, then wakes up showing twelve lights in two rows of six, with
        a 40 second countdown. A filled circle below is a lit light. A hollow circle is a dark light. Have the
        Defuser read out both rows, left to right. Find the matching picture.
      </ManualLead>
      <ManualLead>
        The dial must point the way the table says when the countdown reaches zero. The turn button moves the
        dial one step clockwise. If the dial points the wrong way at zero, that is a strike. Then it sleeps
        and wakes later with new lights. The dial stays where it was left.
      </ManualLead>
      <ManualTable
        head={["Lights", "Point the dial"]}
        rows={rules.patterns.map((pattern) => [
          <Lights key="lights" leds={pattern.leds} />,
          <Direction key="direction" direction={pattern.direction} />,
        ])}
      />
    </>
  );
}
