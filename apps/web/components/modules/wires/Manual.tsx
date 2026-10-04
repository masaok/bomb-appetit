import type { WireCondition, WiresRules, WireTarget } from "@bombappetit/engine/modules/wires";
import { ColorWord, ManualLead, ManualSubheading, RuleList } from "@/components/manual/primitives";
import { GAME_COLORS } from "../colors";
import type { ModuleManualProps } from "../types";

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];
const NUMBER_WORDS = ["no", "one", "two", "three"];

function Color({ color }: { color: keyof typeof GAME_COLORS }) {
  return <ColorWord name={GAME_COLORS[color].name} hex={GAME_COLORS[color].hex} />;
}

function Condition({ condition }: { condition: WireCondition }) {
  switch (condition.kind) {
    case "count":
      if (condition.cmp === "none") {
        return (
          <>
            there are no <Color color={condition.color} /> wires
          </>
        );
      }
      if (condition.cmp === "exactly") {
        return (
          <>
            there {condition.n === 1 ? "is" : "are"} exactly {NUMBER_WORDS[condition.n]}{" "}
            <Color color={condition.color} /> {condition.n === 1 ? "wire" : "wires"}
          </>
        );
      }
      return condition.n === 0 ? (
        <>
          there is at least one <Color color={condition.color} /> wire
        </>
      ) : (
        <>
          there is more than {NUMBER_WORDS[condition.n]} <Color color={condition.color} /> wire
        </>
      );
    case "lastIs":
      return (
        <>
          the last wire is <Color color={condition.color} />
        </>
      );
    case "serial":
      return <>the last digit of the serial number is {condition.parity}</>;
  }
}

function Target({ target }: { target: WireTarget }) {
  switch (target.kind) {
    case "position":
      return <>cut the {ORDINALS[target.index]} wire</>;
    case "last":
      return <>cut the last wire</>;
    case "firstOf":
      return (
        <>
          cut the first <Color color={target.color} /> wire
        </>
      );
    case "lastOf":
      return (
        <>
          cut the last <Color color={target.color} /> wire
        </>
      );
  }
}

export function Manual({ rules }: ModuleManualProps<WiresRules>) {
  return (
    <>
      <ManualLead>
        A panel with three to six wires. Exactly one wire must be cut. Wires are counted from the top,
        starting at one. Find the list for the number of wires, then read it from the top and stop at the
        first line that is true.
      </ManualLead>
      {rules.clauses.map((clause) => (
        <section key={clause.count} className="break-inside-avoid">
          <ManualSubheading>{clause.count} wires</ManualSubheading>
          <RuleList>
            {clause.rules.map((rule, i) => (
              <li key={i}>
                If{" "}
                {rule.when.map((condition, c) => (
                  <span key={c}>
                    {c > 0 && " and "}
                    <Condition condition={condition} />
                  </span>
                ))}
                , <Target target={rule.cut} />.
              </li>
            ))}
            <li>
              Otherwise, <Target target={clause.otherwise} />.
            </li>
          </RuleList>
        </section>
      ))}
    </>
  );
}
