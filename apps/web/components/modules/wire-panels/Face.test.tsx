import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { WirePanelsState } from "@bombappetit/engine/modules/wire-panels";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };
const state: WirePanelsState = {
  panels: [
    [{ color: "red", to: 2, cut: false }, null, { color: "black", to: 0, cut: true }],
    [null, { color: "blue", to: 1, cut: false }, null],
    [{ color: "blue", to: 0, cut: false }, null, null],
    [{ color: "red", to: 1, cut: false }, null, null],
  ],
  page: 0,
};

it("cuts the wire that was clicked and turns the panel", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Wire 1, Red, to C" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "cut", index: 0 });
  fireEvent.click(screen.getByRole("button", { name: "Next panel" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "next" });
  fireEvent.keyDown(screen.getByRole("button", { name: "Next panel" }), { key: "Enter" });
  expect(dispatch).toHaveBeenCalledTimes(3);
});

it("shows only the current panel and its number", () => {
  const { rerender } = render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByText("1/4")).toBeTruthy();
  expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
    "Wire 1, Red, to C",
    "Wire 3, Black, to A, cut",
    "Next panel",
  ]);
  rerender(<Face state={{ ...state, page: 1 }} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByText("2/4")).toBeTruthy();
  expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
    "Wire 2, Blue, to B",
    "Next panel",
  ]);
});

it("marks a cut wire as disabled", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("button", { name: "Wire 3, Black, to A, cut" }).getAttribute("aria-disabled")).toBe(
    "true",
  );
});
