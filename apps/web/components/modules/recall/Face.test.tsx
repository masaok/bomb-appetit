import type { RecallState } from "@bombappetit/engine/modules/recall";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };

const state: RecallState = {
  key: "k",
  resets: 0,
  stages: [
    { display: 2, labels: [3, 1, 4, 2] },
    { display: 4, labels: [4, 2, 1, 3] },
    { display: 1, labels: [1, 2, 3, 4] },
    { display: 3, labels: [2, 3, 4, 1] },
    { display: 1, labels: [1, 4, 2, 3] },
  ],
  history: [],
};

it("presses the position of the button that was clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Button 4, position 3" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "press", position: 2 });
});

it("presses with the keyboard", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.keyDown(screen.getByRole("button", { name: "Button 3, position 1" }), { key: " " });
  expect(dispatch).toHaveBeenCalledWith({ type: "press", position: 0 });
});

it("shows the current stage's display, labels and progress", () => {
  const second = { ...state, history: [{ position: 2, label: 4 }] };
  render(<Face state={second} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByLabelText("Display: 4").textContent).toBe("4");
  expect(screen.getByRole("button", { name: "Button 4, position 1" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "1 of 5 stages complete" })).toBeTruthy();
});

it("locks the buttons once solved", () => {
  const done = { ...state, history: Array.from({ length: 5 }, () => ({ position: 0, label: 1 })) };
  render(<Face state={done} solved bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("button", { name: "Button 1, position 1" }).getAttribute("aria-disabled")).toBe(
    "true",
  );
  expect(screen.getByRole("img", { name: "5 of 5 stages complete" })).toBeTruthy();
});
