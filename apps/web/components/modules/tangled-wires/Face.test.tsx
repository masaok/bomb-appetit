import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { TangledWiresState } from "@bombappetit/engine/modules/tangled-wires";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };
const state: TangledWiresState = {
  wires: [
    { red: true, blue: false, star: false, led: true, to: 2 },
    { red: true, blue: true, star: true, led: false, to: 0 },
    { red: false, blue: false, star: false, led: false, to: 3 },
    { red: false, blue: true, star: true, led: true, to: 1 },
  ],
  cut: [false, false, true, false],
};

it("cuts the wire that was clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Wire 2, red and blue striped, light off, star" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "cut", index: 1 });
  fireEvent.keyDown(screen.getByRole("button", { name: "Wire 4, blue, light on, star" }), { key: " " });
  expect(dispatch).toHaveBeenLastCalledWith({ type: "cut", index: 3 });
});

it("describes every wire by color, light and star", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
    "Wire 1, red, light on, no star",
    "Wire 2, red and blue striped, light off, star",
    "Wire 3, white, light off, no star, cut",
    "Wire 4, blue, light on, star",
  ]);
  expect(screen.getByText("RB")).toBeTruthy();
});

it("marks a cut wire as disabled", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  const cut = screen.getByRole("button", { name: "Wire 3, white, light off, no star, cut" });
  expect(cut.getAttribute("aria-disabled")).toBe("true");
  expect(
    screen.getByRole("button", { name: "Wire 1, red, light on, no star" }).getAttribute("aria-disabled"),
  ).toBe("false");
});
