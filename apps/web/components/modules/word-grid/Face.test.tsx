import type { WordGridState } from "@bombappetit/engine/modules/word-grid";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };

const state: WordGridState = {
  stages: [
    { display: "FLOUR", buttons: ["WAIT", "WEIGHT", "RIGHT", "WHAT", "OWE", "KNOT"] },
    { display: "THYME", buttons: ["HMM", "HUH", "OH", "STOP", "NOW", "KNOW"] },
    { display: "LEEK", buttons: ["WITCH", "WHICH", "AGAIN", "GO ON", "GOT IT", "NOT"] },
  ],
  stage: 0,
};

it("presses the position of the button that was clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "WHAT, middle right" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "press", position: 3 });
});

it("presses with the keyboard", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.keyDown(screen.getByRole("button", { name: "OWE, bottom left" }), { key: "Enter" });
  expect(dispatch).toHaveBeenCalledWith({ type: "press", position: 4 });
});

it("shows the current stage's display, buttons and progress", () => {
  render(<Face state={{ ...state, stage: 1 }} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByLabelText("Display: THYME").textContent).toBe("THYME");
  expect(screen.getByRole("button", { name: "STOP, middle right" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "WAIT, top left" })).toBeNull();
  expect(screen.getByRole("img", { name: "1 of 3 stages complete" })).toBeTruthy();
});

it("locks the buttons once solved", () => {
  render(<Face state={{ ...state, stage: 3 }} solved bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("button", { name: "WITCH, top left" }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("img", { name: "3 of 3 stages complete" })).toBeTruthy();
});
