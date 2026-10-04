import type { PasscodeState } from "@bombappetit/engine/modules/passcode";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };

const state: PasscodeState = {
  wheels: [
    ["L", "X", "D", "Q", "Z", "S"],
    ["A", "E", "K", "U", "W", "Y"],
    ["T", "C", "R", "M", "G", "V"],
    ["P", "O", "E", "H", "D", "J"],
    ["F", "I", "N", "L", "T", "X"],
  ],
  showing: [0, 1, 3, 1, 5],
};

it("spins a wheel with its arrow buttons", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Wheel 2 up" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "spin", wheel: 1, dir: -1 });
  fireEvent.click(screen.getByRole("button", { name: "Wheel 5 down" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "spin", wheel: 4, dir: 1 });
});

it("spins a focused wheel with the arrow keys", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  const wheel = screen.getByRole("spinbutton", { name: "Wheel 3" });
  fireEvent.keyDown(wheel, { key: "ArrowDown" });
  expect(dispatch).toHaveBeenLastCalledWith({ type: "spin", wheel: 2, dir: 1 });
  fireEvent.keyDown(wheel, { key: "ArrowUp" });
  expect(dispatch).toHaveBeenLastCalledWith({ type: "spin", wheel: 2, dir: -1 });
  fireEvent.keyDown(wheel, { key: "a" });
  expect(dispatch).toHaveBeenCalledTimes(2);
});

it("submits", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "submit" });
});

it("shows the letter each wheel is turned to", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  const showing = screen.getAllByRole("spinbutton").map((w) => w.getAttribute("aria-valuetext"));
  expect(showing).toEqual(["L", "E", "M", "O", "X"]);
});
