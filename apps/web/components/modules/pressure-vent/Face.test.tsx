import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { PressureVentState } from "@bombappetit/engine/modules/pressure-vent";
import { Face } from "./Face";

const bomb = { elapsedMs: 45_500, strikes: 0, timerText: "4:14" };
const active: PressureVentState = {
  kind: "active",
  key: "k",
  cycle: 0,
  prompt: "Salt the fuse?",
  deadlineMs: 70_000,
};
const asleep: PressureVentState = { kind: "asleep", key: "k", cycle: 1, wakeAtMs: 90_000 };

it("answers with the button that was clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={active} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Yes" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "answer", yes: true });
  fireEvent.click(screen.getByRole("button", { name: "No" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "answer", yes: false });
});

it("shows the prompt and its own countdown, rounded up to whole seconds", () => {
  render(<Face state={active} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByText("Salt the fuse?")).toBeTruthy();
  expect(screen.getByRole("timer", { name: "Countdown, 25 seconds left" }).textContent).toBe("25");
});

it("is dormant while asleep: no prompt, no countdown, buttons off", () => {
  const dispatch = vi.fn();
  render(<Face state={asleep} solved={false} bomb={bomb} dispatch={dispatch} />);
  expect(screen.queryByText("Salt the fuse?")).toBeNull();
  expect(screen.getByRole("timer", { name: "Countdown, asleep" }).textContent).toBe("--");
  const yes = screen.getByRole<HTMLButtonElement>("button", { name: "Yes" });
  expect(yes.disabled).toBe(true);
  fireEvent.click(yes);
  expect(dispatch).not.toHaveBeenCalled();
});
