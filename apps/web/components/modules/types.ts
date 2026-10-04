import type { ActionOf, ModuleId, RulesOf, StateOf } from "@bombappetit/engine";

/** Live bomb readings a module face may show or animate from. */
export interface BombReadout {
  /** Milliseconds since the bomb was armed. Updates about ten times a second. */
  elapsedMs: number;
  strikes: number;
  /** The countdown display text. */
  timerText: string;
}

/**
 * What the Defuser sees and touches. A face draws itself inside a fixed
 * 300 x 300 px box; `ModuleFrame` scales that box to fit the slot.
 */
export interface ModuleFaceProps<State, Action> {
  state: State;
  solved: boolean;
  bomb: BombReadout;
  dispatch: (action: Action) => void;
}

/** What the Experts read. Rendered from the rule set only, never from a bomb. */
export interface ModuleManualProps<Rules> {
  rules: Rules;
}

export type FaceProps<K extends ModuleId> = ModuleFaceProps<StateOf<K>, ActionOf<K>>;
export type ManualProps<K extends ModuleId> = ModuleManualProps<RulesOf<K>>;
