import { bigButton, type BigButtonState } from "@bombappetit/engine/modules/big-button";
import { createRng } from "@bombappetit/engine";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";
import { Manual } from "./Manual";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };
const idle: BigButtonState = { color: "red", label: "BOOP", strip: "blue", press: { kind: "idle" } };

it("dispatches press and release from the big button", () => {
  const dispatch = vi.fn();
  render(<Face state={idle} solved={false} bomb={bomb} dispatch={dispatch} />);
  const button = screen.getByRole("button", { name: "Big button, Red, BOOP" });
  fireEvent.pointerDown(button);
  expect(dispatch.mock.calls).toEqual([[{ type: "press" }]]);
  fireEvent.pointerUp(button);
  expect(dispatch.mock.calls).toEqual([[{ type: "press" }], [{ type: "release" }]]);
});

it("lights the strip only while the button is held", () => {
  const { rerender } = render(<Face state={idle} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("img", { name: "Strip, off" }).textContent).toBe("");
  rerender(
    <Face
      state={{ ...idle, press: { kind: "held", sinceMs: 0 } }}
      solved={false}
      bomb={bomb}
      dispatch={() => {}}
    />,
  );
  expect(screen.getByRole("img", { name: "Strip, Blue" }).textContent).toBe("B");
});

it("prints every rule line and the strip table in the manual", () => {
  const rules = bigButton.generateRules(createRng("rules:1").fork("big-button"));
  const { container } = render(<Manual rules={rules} />);
  expect(container.querySelectorAll("ol > li")).toHaveLength(rules.rules.length + 1);
  const rows = [...container.querySelectorAll("tbody tr")].map((row) => row.textContent);
  expect(rows).toEqual([
    `red${rules.stripDigits.red}`,
    `blue${rules.stripDigits.blue}`,
    `yellow${rules.stripDigits.yellow}`,
    `white${rules.stripDigits.white}`,
    `green${rules.stripDigits.green}`,
  ]);
});
