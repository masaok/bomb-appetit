import type { RecallInstruction, RecallRules } from "@bombappetit/engine/modules/recall";
import { ManualLead, ManualSubheading, ManualTable } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

const ORDINALS = ["first", "second", "third", "fourth"];

function Instruction({ instruction }: { instruction: RecallInstruction }) {
  switch (instruction.kind) {
    case "position":
      return <>Press the button in the {ORDINALS[instruction.position]} position.</>;
    case "label":
      return <>Press the button labeled {instruction.label}.</>;
    case "samePosition":
      return <>Press the button in the same position as you pressed in stage {instruction.stage + 1}.</>;
    case "sameLabel":
      return <>Press the button with the same label as you pressed in stage {instruction.stage + 1}.</>;
  }
}

export function Manual({ rules }: ModuleManualProps<RecallRules>) {
  return (
    <>
      <ManualLead>
        A display with one digit, and four buttons labeled 1 to 4 in a mixed-up order. There are{" "}
        {rules.stages.length} stages. Positions are counted from the left, starting at one. At every stage,
        write down the position and the label of the button that was pressed. Later stages ask for them. A
        wrong press is a strike. The module then goes back to stage 1 with new numbers, so throw your notes
        away.
      </ManualLead>
      {rules.stages.map((row, stage) => (
        <section key={stage} className="break-inside-avoid">
          <ManualSubheading>Stage {stage + 1}</ManualSubheading>
          <ManualTable
            head={["Display", "Do this"]}
            rows={row.map((instruction, d) => [
              <span key="d" className="font-mono font-bold">
                {d + 1}
              </span>,
              <Instruction key="i" instruction={instruction} />,
            ])}
          />
        </section>
      ))}
    </>
  );
}
