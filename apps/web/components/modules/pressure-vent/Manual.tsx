import type { PressureVentRules } from "@bombappetit/engine/modules/pressure-vent";
import { ManualLead, ManualTable } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

export function Manual({ rules }: ModuleManualProps<PressureVentRules>) {
  return (
    <>
      <ManualLead>
        This module cannot be solved. It sleeps, then wakes up with a question, a Yes button, a No button and
        a 40 second countdown. Have the Defuser read the question aloud. Find it in the table. Say the answer
        next to it.
      </ManualLead>
      <ManualLead>
        The right answer puts it back to sleep. A wrong answer is a strike. Letting the countdown reach zero
        is a strike. It will wake again later with another question.
      </ManualLead>
      <ManualTable
        head={["The panel asks", "Press"]}
        rows={rules.prompts.map((prompt) => [
          prompt.text,
          <strong key="answer">{prompt.yes ? "Yes" : "No"}</strong>,
        ])}
      />
    </>
  );
}
