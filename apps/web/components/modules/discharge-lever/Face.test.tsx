import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { DischargeLeverState } from "@bombappetit/engine/modules/discharge-lever";
import { Face } from "./Face";

const bomb = { elapsedMs: 48_000, strikes: 0, timerText: "4:12" };
const filling: DischargeLeverState = { kind: "running", level: 0, atMs: 30_000, held: false };
const idle: DischargeLeverState = { kind: "idle", startAtMs: 60_000 };

it("reports press and release of the lever separately", () => {
  const dispatch = vi.fn();
  render(<Face state={filling} solved={false} bomb={bomb} dispatch={dispatch} />);
  const lever = screen.getByRole("button", { name: "Discharge lever" });
  fireEvent.pointerDown(lever);
  expect(dispatch.mock.calls).toEqual([[{ type: "press" }]]);
  fireEvent.pointerUp(lever);
  expect(dispatch.mock.calls).toEqual([[{ type: "press" }], [{ type: "release" }]]);
});

it("draws the meter from the state and the bomb clock", () => {
  render(<Face state={filling} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("meter", { name: "Charge" }).getAttribute("aria-valuenow")).toBe("40");
  expect(screen.getByText("40%")).toBeTruthy();
  expect(screen.getByText("Charging")).toBeTruthy();
});

it("warns once the meter is above the danger line", () => {
  render(<Face state={filling} solved={false} bomb={{ ...bomb, elapsedMs: 66_000 }} dispatch={() => {}} />);
  expect(screen.getByRole("meter", { name: "Charge" }).getAttribute("aria-valuenow")).toBe("80");
  expect(screen.getByText("Pull now!")).toBeTruthy();
});

it("shows the lever as held while draining", () => {
  const held: DischargeLeverState = { kind: "running", level: 30_000, atMs: 47_000, held: true };
  render(<Face state={held} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("button", { name: "Discharge lever" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText("55%")).toBeTruthy();
});

it("is dormant before it starts: empty meter, lever off", () => {
  render(<Face state={idle} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("meter", { name: "Charge" }).getAttribute("aria-valuenow")).toBe("0");
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Discharge lever" }).disabled).toBe(true);
  expect(screen.getByText("--")).toBeTruthy();
});
