import {
  BIG_BUTTON_COLORS,
  type BigButtonColor,
  type BigButtonCondition,
  type BigButtonMove,
  type BigButtonRules,
} from "@bombappetit/engine/modules/big-button";
import {
  ColorWord,
  ManualLead,
  ManualSubheading,
  ManualTable,
  RuleList,
} from "@/components/manual/primitives";
import { GAME_COLORS } from "../colors";
import type { ModuleManualProps } from "../types";

function Color({ color }: { color: BigButtonColor }) {
  return <ColorWord name={GAME_COLORS[color].name} hex={GAME_COLORS[color].hex} />;
}

function Condition({ condition }: { condition: BigButtonCondition }) {
  switch (condition.kind) {
    case "color":
      return (
        <>
          the button is <Color color={condition.color} />
        </>
      );
    case "label":
      return (
        <>
          the button says <strong>{condition.label}</strong>
        </>
      );
    case "batteries":
      return (
        <>
          the bomb has {condition.cmp === "moreThan" ? "more" : "fewer"} than {condition.n}{" "}
          {condition.n === 1 ? "battery" : "batteries"}
        </>
      );
    case "litIndicator":
      return (
        <>
          there is a lit indicator labelled <strong>{condition.label}</strong>
        </>
      );
  }
}

function Move({ move }: { move: BigButtonMove }) {
  return move === "tap" ? <>tap the button</> : <>hold the button</>;
}

export function Manual({ rules }: ModuleManualProps<BigButtonRules>) {
  return (
    <>
      <ManualLead>
        One big button with a color and a word. Either tap it or hold it. A tap is a press and a release in
        under half a second. Read the list from the top and stop at the first line that is true.
      </ManualLead>
      <RuleList>
        {rules.rules.map((rule, i) => (
          <li key={i}>
            If{" "}
            {rule.when.map((condition, c) => (
              <span key={c}>
                {c > 0 && " and "}
                <Condition condition={condition} />
              </span>
            ))}
            , <Move move={rule.then} />.
          </li>
        ))}
        <li>
          Otherwise, <Move move={rules.otherwise} />.
        </li>
      </RuleList>
      <section className="break-inside-avoid">
        <ManualSubheading>Letting go of a held button</ManualSubheading>
        <ManualLead>
          Keep holding. A strip beside the button lights up. Find the strip color below. Let go when the
          countdown shows that digit in any position.
        </ManualLead>
        <ManualTable
          head={["Strip color", "Let go when the countdown shows a"]}
          rows={BIG_BUTTON_COLORS.map((color) => [
            <Color key="color" color={color} />,
            <strong key="digit">{rules.stripDigits[color]}</strong>,
          ])}
        />
      </section>
    </>
  );
}
