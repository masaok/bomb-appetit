import {
  BLINKER_FREQUENCIES,
  type BlinkerCodeEntry,
  type BlinkerPulse,
  type BlinkerRules,
} from "@bombappetit/engine/modules/blinker";
import { ManualLead, ManualSubheading, ManualTable, RuleList } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

const PULSE_WIDTH: Record<BlinkerPulse, number> = { short: 16, long: 32 };

function Pulses({ pulses }: { pulses: BlinkerPulse[] }) {
  const starts = pulses.map((_, i) => pulses.slice(0, i).reduce((sum, p) => sum + PULSE_WIDTH[p], 0));
  const width = pulses.reduce((sum, p) => sum + PULSE_WIDTH[p], 0);
  return (
    <svg
      width={width}
      height="14"
      viewBox={`0 0 ${width} 14`}
      role="img"
      aria-label={pulses.join(", ")}
      className="inline-block align-middle"
    >
      {pulses.map((pulse, i) =>
        pulse === "short" ? (
          <circle key={i} cx={(starts[i] ?? 0) + 5} cy="7" r="5" fill="currentColor" />
        ) : (
          <rect key={i} x={starts[i] ?? 0} y="2" width="26" height="10" rx="3" fill="currentColor" />
        ),
      )}
    </svg>
  );
}

/** Sorted the way an Expert looks things up: by how many flashes, then short before long. */
function byPulses(a: BlinkerCodeEntry, b: BlinkerCodeEntry): number {
  const key = (e: BlinkerCodeEntry) => e.pulses.map((p) => (p === "short" ? "0" : "1")).join("");
  return a.pulses.length - b.pulses.length || key(a).localeCompare(key(b));
}

export function Manual({ rules }: ModuleManualProps<BlinkerRules>) {
  const code = [...rules.code].sort(byPulses);
  const codeHalf = Math.ceil(code.length / 2);
  const words = [...rules.words].sort((a, b) => a.word.localeCompare(b.word));
  const wordHalf = Math.ceil(words.length / 2);
  const frequency = (index: number) => `${BLINKER_FREQUENCIES[index] ?? "?"} MHz`;

  return (
    <>
      <ManualLead>
        A light blinks one word, over and over. Each letter is a group of short and long flashes. A
        dark pause separates two letters. A much longer dark pause means the word is starting again.
      </ManualLead>
      <RuleList>
        <li>Have the Defuser call out each letter as flashes, for example &quot;short, long, short&quot;.</li>
        <li>Find each group of flashes in the code table.</li>
        <li>Find the word in the word list.</li>
        <li>Tune to the frequency beside that word.</li>
        <li>Press the transmit button.</li>
      </RuleList>

      <section className="break-inside-avoid">
        <ManualSubheading>Code table</ManualSubheading>
        <ManualLead>A dot is a short flash. A bar is a long flash. Groups with fewer flashes come first.</ManualLead>
        <ManualTable
          head={["Flashes", "Letter", "Flashes", "Letter"]}
          rows={code.slice(0, codeHalf).map((entry, i) => {
            const other = code[i + codeHalf];
            return [
              <Pulses key="a" pulses={entry.pulses} />,
              <strong key="b">{entry.letter}</strong>,
              other ? <Pulses key="c" pulses={other.pulses} /> : "",
              other ? <strong key="d">{other.letter}</strong> : "",
            ];
          })}
        />
      </section>

      <section className="break-inside-avoid">
        <ManualSubheading>Word list</ManualSubheading>
        <ManualTable
          head={["Word", "Frequency", "Word", "Frequency"]}
          rows={words.slice(0, wordHalf).map((entry, i) => {
            const other = words[i + wordHalf];
            return [
              <strong key="a">{entry.word}</strong>,
              frequency(entry.frequency),
              other ? <strong key="c">{other.word}</strong> : "",
              other ? frequency(other.frequency) : "",
            ];
          })}
        />
      </section>
    </>
  );
}
