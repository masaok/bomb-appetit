import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };

it("cuts the wire that was clicked", () => {
  const dispatch = vi.fn();
  render(
    <Face
      state={{ wires: ["red", "blue", "white"], cut: [false, false, false] }}
      solved={false}
      bomb={bomb}
      dispatch={dispatch}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Wire 2, Blue" }));
  expect(dispatch).toHaveBeenCalledWith({ type: "cut", index: 1 });
});

it("labels a cut wire as cut", () => {
  render(
    <Face
      state={{ wires: ["red", "blue", "white"], cut: [true, false, false] }}
      solved={false}
      bomb={bomb}
      dispatch={() => {}}
    />,
  );
  expect(screen.getByRole("button", { name: "Wire 1, Red, cut" }).getAttribute("aria-disabled")).toBe("true");
});
