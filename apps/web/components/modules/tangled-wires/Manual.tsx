import {
  tangledWiresFlags,
  TANGLED_WIRES_INSTRUCTIONS,
  TANGLED_WIRES_LETTERS,
  type TangledWiresInstruction,
  type TangledWiresRules,
} from "@bombappetit/engine/modules/tangled-wires";
import { ManualLead, ManualSubheading, ManualTable } from "@/components/manual/primitives";
import { GAME_COLORS } from "../colors";
import type { ModuleManualProps } from "../types";

/** One ellipse per flag, in region-bit order: red, blue, star, light. */
const SETS = [
  { label: "RED", cx: 140, cy: 168, rot: 40, stroke: GAME_COLORS.red.hex, dash: undefined, lx: 36, ly: 66, anchor: "end" },
  { label: "BLUE", cx: 180, cy: 132, rot: 40, stroke: GAME_COLORS.blue.hex, dash: "10 5", lx: 96, ly: 26, anchor: "end" },
  { label: "STAR", cx: 220, cy: 132, rot: -40, stroke: "#b97a00", dash: "2 5", lx: 304, ly: 26, anchor: "start" },
  { label: "LIGHT ON", cx: 260, cy: 168, rot: -40, stroke: "#1f8a5f", dash: "12 4 2 4", lx: 364, ly: 66, anchor: "start" },
] as const;

/** Where each region's letter sits, indexed by region. Each point is the middle of the widest part of its region. */
const SPOTS: [number, number][] = [
  [-24, 264], [71, 163], [152, 58], [104, 100],
  [248, 58], [128, 204], [200, 84], [160, 124],
  [329, 163], [199, 249], [272, 204], [239, 223],
  [294, 100], [160, 223], [240, 124], [200, 183],
];

function instructionText(instruction: TangledWiresInstruction, rules: TangledWiresRules): string {
  switch (instruction) {
    case "cut":
      return "Cut the wire.";
    case "skip":
      return "Do not cut the wire.";
    case "serial":
      return "Cut the wire if the last digit of the serial number is even.";
    case "port":
      return `Cut the wire if the bomb has a ${rules.port} port.`;
    case "battery":
      return "Cut the wire if the bomb has two or more batteries.";
  }
}

function wireName(red: boolean, blue: boolean): string {
  if (red && blue) return "Red and blue striped";
  if (red) return "Red";
  if (blue) return "Blue";
  return "White";
}

export function Manual({ rules }: ModuleManualProps<TangledWiresRules>) {
  const letter = (region: number) => TANGLED_WIRES_LETTERS[rules.table[region] ?? "skip"];

  return (
    <>
      <ManualLead>
        Four to six wires run from top to bottom and cross each other. Each wire is white, red, blue,
        or red and blue striped. Each wire has a light above its top end. Each wire may have a star
        below its bottom end. Follow a wire with care, because it rarely ends under where it starts.
      </ManualLead>
      <ManualLead>
        Take one wire at a time. Ask four things: does it have red, does it have blue, does it have a
        star, is its light on. Find the letter for that mix in the diagram or in the table. Do what
        the letter says. Cut every wire that needs cutting. Leave the rest alone.
      </ManualLead>

      <section className="break-inside-avoid">
        <ManualSubheading>What the letters mean</ManualSubheading>
        <ManualTable
          head={["Letter", "Instruction"]}
          rows={TANGLED_WIRES_INSTRUCTIONS.map((instruction) => [
            <strong key="l">{TANGLED_WIRES_LETTERS[instruction]}</strong>,
            instructionText(instruction, rules),
          ])}
        />
      </section>

      <section className="break-inside-avoid">
        <ManualSubheading>Diagram</ManualSubheading>
        <ManualLead>
          Each loop is one fact about the wire. Stand inside every loop that is true and outside
          every loop that is false. A white wire with no star and its light off is outside all four.
        </ManualLead>
        <svg
          viewBox="-50 0 500 290"
          className="mt-3 w-full max-w-xl"
          role="img"
          aria-label="Diagram of four overlapping loops: red, blue, star and light on. The table below holds the same letters."
        >
          {SETS.map((set) => (
            <ellipse
              key={set.label}
              cx={set.cx}
              cy={set.cy}
              rx="130"
              ry="76"
              transform={`rotate(${set.rot} ${set.cx} ${set.cy})`}
              fill={set.stroke}
              fillOpacity="0.1"
              stroke={set.stroke}
              strokeWidth="3"
              strokeDasharray={set.dash}
            />
          ))}
          {SETS.map((set) => (
            <text
              key={set.label}
              x={set.lx}
              y={set.ly}
              textAnchor={set.anchor}
              fontSize="15"
              fontWeight="700"
              fill="currentColor"
              className="font-display"
            >
              {set.label}
            </text>
          ))}
          <rect x="-42" y="248" width="136" height="32" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <text x="-6" y="268" fontSize="12" fontWeight="700" fill="currentColor">
            none of these
          </text>
          {SPOTS.map(([x, y], region) => (
            <text key={region} x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor">
              {letter(region)}
            </text>
          ))}
        </svg>
      </section>

      <section className="break-inside-avoid">
        <ManualSubheading>Table</ManualSubheading>
        <ManualTable
          head={["Wire", "Star", "Light", "Letter"]}
          // Rows grouped by wire color, which is what the Defuser names first.
          rows={Array.from({ length: 16 }, (_, region) => ({ region, flags: tangledWiresFlags(region) }))
            .sort((a, b) => ((a.region & 3) - (b.region & 3)) || a.region - b.region)
            .map(({ region, flags }) => [
              wireName(flags.red, flags.blue),
              flags.star ? "Star" : "No star",
              flags.led ? "On" : "Off",
              <strong key="l">{letter(region)}</strong>,
            ])}
        />
      </section>
    </>
  );
}
