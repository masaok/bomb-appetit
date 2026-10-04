import { createRng } from "@bombappetit/engine";
import {
  glyphKeypad,
  GLYPH_KEYPAD_GLYPHS,
  type GlyphKeypadState,
} from "@bombappetit/engine/modules/glyph-keypad";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";
import { Glyph } from "./glyphs";
import { Manual } from "./Manual";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };
const state: GlyphKeypadState = {
  glyphs: ["circle-dot", "arch-zigzag", "triangle-ring", "hexagon-plus"],
  pressed: [false, true, false, false],
};

it("presses the key that was clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Key 3, triangle ring" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "press", position: 2 });
});

it("labels a pressed key as pressed", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(
    screen.getByRole("button", { name: "Key 2, arch zigzag, pressed" }).getAttribute("aria-disabled"),
  ).toBe("true");
  expect(screen.getByRole("button", { name: "Key 1, circle dot" }).getAttribute("aria-disabled")).toBe(
    "false",
  );
});

it("draws a different stroke-only picture for each of the 30 glyphs", () => {
  const pictures = GLYPH_KEYPAD_GLYPHS.map((id) => {
    const { container, unmount } = render(<Glyph id={id} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("none");
    expect(svg?.children).toHaveLength(2);
    const html = svg?.innerHTML ?? "";
    unmount();
    return html;
  });
  expect(new Set(pictures).size).toBe(30);
});

it("shows all six columns in the manual, top to bottom", () => {
  const rules = glyphKeypad.generateRules(createRng("rules:1").fork("glyph-keypad"));
  const { container } = render(<Manual rules={rules} />);
  expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
    "Column 1",
    "Column 2",
    "Column 3",
    "Column 4",
    "Column 5",
    "Column 6",
  ]);
  const rows = [...container.querySelectorAll("tbody tr")];
  expect(rows).toHaveLength(7);
  const thirdColumn = rows.map((row) =>
    row.querySelectorAll("td")[2]?.querySelector("svg")?.getAttribute("aria-label"),
  );
  expect(thirdColumn).toEqual(rules.columns[2]?.map((g) => g.replace("-", " ")));
});
