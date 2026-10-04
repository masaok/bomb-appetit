import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { BlinkerState } from "@bombappetit/engine/modules/blinker";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };
// Short then long: on 0-250, off 250-500, on 500-1250, then dark until 3750.
const state: BlinkerState = { letters: [["short", "long"]], tuned: 4 };

it("dispatches tune and transmit actions", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Tune up" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "tune", dir: 1 });
  fireEvent.click(screen.getByRole("button", { name: "Tune down" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "tune", dir: -1 });
  fireEvent.keyDown(screen.getByRole("button", { name: "Transmit" }), { key: "Enter" });
  expect(dispatch).toHaveBeenLastCalledWith({ type: "transmit" });
  expect(dispatch).toHaveBeenCalledTimes(3);
});

it("shows the tuned frequency", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByText("3.541")).toBeTruthy();
  expect(screen.getByText("MHz")).toBeTruthy();
});

it("lights the lamp from the bomb clock", () => {
  const at = (elapsedMs: number) => <Face state={state} solved={false} bomb={{ ...bomb, elapsedMs }} dispatch={() => {}} />;
  const { rerender } = render(at(100));
  expect(screen.getByRole("img", { name: "Signal light, on" })).toBeTruthy();
  rerender(at(300));
  expect(screen.getByRole("img", { name: "Signal light, off" })).toBeTruthy();
  rerender(at(1000));
  expect(screen.getByRole("img", { name: "Signal light, on" })).toBeTruthy();
  rerender(at(2000));
  expect(screen.getByRole("img", { name: "Signal light, off" })).toBeTruthy();
});

it("disables a tune button at the end of the dial", () => {
  const dispatch = vi.fn();
  render(<Face state={{ ...state, tuned: 15 }} solved={false} bomb={bomb} dispatch={dispatch} />);
  const up = screen.getByRole("button", { name: "Tune up" });
  expect(up.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(up);
  expect(dispatch).not.toHaveBeenCalled();
});
