import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { DialAlignmentState } from "@bombappetit/engine/modules/dial-alignment";
import { Face } from "./Face";

const bomb = { elapsedMs: 38_200, strikes: 0, timerText: "4:21" };
const leds = [..."#.....#....."].map((ch) => ch === "#");
const active: DialAlignmentState = { kind: "active", dial: "left", key: "k", cycle: 0, leds, deadlineMs: 70_000 };
const asleep: DialAlignmentState = { kind: "asleep", dial: "down", key: "k", cycle: 1, wakeAtMs: 90_000 };

it("turns the dial when the turn button is clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={active} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Turn dial clockwise" }));
  expect(dispatch.mock.calls).toEqual([[{ type: "turn" }]]);
});

it("shows the lights, the dial position and its own countdown", () => {
  render(<Face state={active} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getAllByRole("img", { name: /^Light \d+, on$/ }).map((el) => el.getAttribute("aria-label"))).toEqual([
    "Light 1, on",
    "Light 7, on",
  ]);
  expect(screen.getAllByRole("img", { name: /^Light \d+, off$/ })).toHaveLength(10);
  expect(screen.getByRole("img", { name: "Dial pointing left" })).toBeTruthy();
  expect(screen.getByRole("timer", { name: "Countdown, 32 seconds left" }).textContent).toBe("32");
});

it("is dormant while asleep: lights out, no countdown, turn button off, dial kept", () => {
  const dispatch = vi.fn();
  render(<Face state={asleep} solved={false} bomb={bomb} dispatch={dispatch} />);
  expect(screen.getAllByRole("img", { name: /^Light \d+, off$/ })).toHaveLength(12);
  expect(screen.getByRole("timer", { name: "Countdown, asleep" }).textContent).toBe("--");
  expect(screen.getByRole("img", { name: "Dial pointing down" })).toBeTruthy();
  const turn = screen.getByRole<HTMLButtonElement>("button", { name: "Turn dial clockwise" });
  expect(turn.disabled).toBe(true);
  fireEvent.click(turn);
  expect(dispatch).not.toHaveBeenCalled();
});
