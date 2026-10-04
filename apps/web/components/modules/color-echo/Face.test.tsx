import type { ColorEchoRules, ColorEchoState } from "@bombappetit/engine/modules/color-echo";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";
import { Manual } from "./Manual";

const state: ColorEchoState = { sequence: ["green", "red", "green", "blue"], stage: 1, entered: 0 };

function litPads(elapsedMs: number, solved = false) {
  const { container, unmount } = render(
    <Face
      state={state}
      solved={solved}
      bomb={{ elapsedMs, strikes: 0, timerText: "5:00" }}
      dispatch={() => {}}
    />,
  );
  const lit = [...container.querySelectorAll('button[data-lit="true"]')].map((b) =>
    b.getAttribute("aria-label"),
  );
  unmount();
  return lit;
}

it("presses the pad that was clicked", () => {
  const dispatch = vi.fn();
  render(
    <Face
      state={state}
      solved={false}
      bomb={{ elapsedMs: 0, strikes: 0, timerText: "5:00" }}
      dispatch={dispatch}
    />,
  );
  expect(screen.getByRole("button", { name: "Yellow pad" }).textContent).toBe("Y");
  fireEvent.click(screen.getByRole("button", { name: "Yellow pad" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "press", color: "yellow" });
});

it.each<[number, string[]]>([
  [0, ["Green pad"]], // first flash
  [450, []], // gap between flashes
  [700, ["Red pad"]], // second flash
  [1300, []], // stage 2 shows only two flashes, then pauses
  [2500, []],
  [2600, ["Green pad"]], // loop restarts after 2 x 600 + 1400 ms
])("at %i ms lights %j", (elapsedMs, expected) => {
  expect(litPads(elapsedMs)).toEqual(expected);
});

it("stops flashing once solved and shows the stage", () => {
  expect(litPads(0, true)).toEqual([]);
  render(
    <Face
      state={state}
      solved={false}
      bomb={{ elapsedMs: 0, strikes: 0, timerText: "5:00" }}
      dispatch={() => {}}
    />,
  );
  expect(screen.getByRole("img", { name: "Stage 2 of 4" }).children).toHaveLength(4);
});

it("prints both tables with a column per strike count", () => {
  const rules: ColorEchoRules = {
    vowel: [
      { red: "blue", blue: "green", green: "yellow", yellow: "red" },
      { red: "green", blue: "red", green: "blue", yellow: "yellow" },
      { red: "yellow", blue: "blue", green: "red", yellow: "green" },
    ],
    noVowel: [
      { red: "red", blue: "yellow", green: "blue", yellow: "green" },
      { red: "blue", blue: "red", green: "yellow", yellow: "green" },
      { red: "green", blue: "yellow", green: "red", yellow: "blue" },
    ],
  };
  const { container } = render(<Manual rules={rules} />);
  const tables = [...container.querySelectorAll("table")].map((table) =>
    [...table.querySelectorAll("tbody tr")].map((row) =>
      [...row.querySelectorAll("td")].map((td) => td.textContent),
    ),
  );
  expect(tables).toEqual([
    [
      ["red", "blue", "green", "yellow"],
      ["blue", "green", "red", "blue"],
      ["green", "yellow", "blue", "red"],
      ["yellow", "red", "yellow", "green"],
    ],
    [
      ["red", "red", "blue", "green"],
      ["blue", "yellow", "red", "yellow"],
      ["green", "blue", "yellow", "red"],
      ["yellow", "green", "green", "blue"],
    ],
  ]);
});
