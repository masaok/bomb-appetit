import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { LabyrinthState } from "@bombappetit/engine/modules/labyrinth";
import { Face } from "./Face";

const bomb = { elapsedMs: 0, strikes: 0, timerText: "5:00" };
const state: LabyrinthState = { markers: [3, 20], position: 8, goal: 35 };

it("moves in the direction of the arrow that was clicked", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  fireEvent.click(screen.getByRole("button", { name: "Move left" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "move", dir: "left" });
  fireEvent.click(screen.getByRole("button", { name: "Move down" }));
  expect(dispatch).toHaveBeenLastCalledWith({ type: "move", dir: "down" });
});

it("moves with the arrow keys when the face is focused", () => {
  const dispatch = vi.fn();
  render(<Face state={state} solved={false} bomb={bomb} dispatch={dispatch} />);
  const face = screen.getByRole("group", { name: "Labyrinth" });
  fireEvent.keyDown(face, { key: "ArrowUp" });
  fireEvent.keyDown(face, { key: "ArrowRight" });
  fireEvent.keyDown(face, { key: "a" });
  expect(dispatch.mock.calls).toEqual([[{ type: "move", dir: "up" }], [{ type: "move", dir: "right" }]]);
});

it("shows the rings, the light and the goal where the state puts them", () => {
  render(<Face state={state} solved={false} bomb={bomb} dispatch={() => {}} />);
  expect(screen.getByRole("img", { name: "Ring at column 4, row 1" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "Ring at column 3, row 4" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "Your light at column 3, row 2" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "Goal at column 6, row 6" })).toBeTruthy();
});
