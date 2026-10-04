import { WORD_GRID_POSITIONS, type WordGridRules } from "@bombappetit/engine/modules/word-grid";
import { ManualLead, ManualSubheading, ManualTable } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

function Word({ children }: { children: string }) {
  return <span className="font-mono font-bold whitespace-nowrap">{children}</span>;
}

export function Manual({ rules }: ModuleManualProps<WordGridRules>) {
  const read = [...rules.read].sort((a, b) => a.display.localeCompare(b.display));
  const priority = [...rules.priority].sort((a, b) => a.word.localeCompare(b.word));
  const half = Math.ceil(read.length / 2);

  return (
    <>
      <ManualLead>
        A display with one word, and six word buttons in two columns and three rows. There are three
        rounds. Many words sound alike. Ask the Defuser to spell every word. A wrong press is a
        strike and the round stays the same.
      </ManualLead>

      <section>
        <ManualSubheading>Step 1: which button to read</ManualSubheading>
        <ManualLead>
          Find the word on the display. It tells you which button to read. Do not press that button
          yet.
        </ManualLead>
        <ManualTable
          head={["Display", "Read the button at", "Display", "Read the button at"]}
          rows={read.slice(0, half).map((left, i) => {
            const right = read[half + i];
            return [
              <Word key="a">{left.display}</Word>,
              WORD_GRID_POSITIONS[left.position],
              right ? <Word key="b">{right.display}</Word> : "",
              right ? WORD_GRID_POSITIONS[right.position] : "",
            ];
          })}
        />
      </section>

      <section>
        <ManualSubheading>Step 2: which button to press</ManualSubheading>
        <ManualLead>
          Find the word you read in the left column. Go through its list from left to right. Press
          the first word in the list that is on any of the six buttons.
        </ManualLead>
        <ManualTable
          head={["Word you read", "Press the first of these that is on a button"]}
          rows={priority.map((p) => [
            <Word key="w">{p.word}</Word>,
            <span key="o" className="font-mono">
              {p.order.join(", ")}
            </span>,
          ])}
        />
      </section>
    </>
  );
}
