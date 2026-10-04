import type { PasscodeRules } from "@bombappetit/engine/modules/passcode";
import { ManualLead, ManualSubheading } from "@/components/manual/primitives";
import type { ModuleManualProps } from "../types";

export function Manual({ rules }: ModuleManualProps<PasscodeRules>) {
  return (
    <>
      <ManualLead>
        Five letter wheels side by side, and a submit button. Each wheel holds six letters. The arrows above
        and below a wheel turn it. Exactly one word from the list below can be spelled, using one letter from
        each wheel, left to right. Ask the Defuser to read out all six letters on the first wheel. Cross out
        every word that does not start with one of them. Do the same for the next wheel until one word is
        left. Set the wheels to that word, then press submit. Submitting anything else is a strike.
      </ManualLead>
      <ManualSubheading>Passcode words</ManualSubheading>
      <ul className="mt-3 max-w-prose columns-3 gap-6 font-mono text-base leading-relaxed font-bold tracking-widest sm:columns-5">
        {rules.words.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>
    </>
  );
}
