import { generateEdgework, timerText, createRng, type Edgework, type ModuleContext } from "../src";

export function ctxFor<Rules>(
  rules: Rules,
  overrides: Partial<ModuleContext<Rules>> = {},
): ModuleContext<Rules> {
  const remainingMs = overrides.remainingMs ?? 300_000;
  return {
    rules,
    edgework: generateEdgework(createRng("test-edgework")),
    strikes: 0,
    elapsedMs: 0,
    remainingMs,
    timerText: timerText(remainingMs),
    ...overrides,
  };
}

export function edgework(overrides: Partial<Edgework> = {}): Edgework {
  return { serial: "AB1CD2", batteries: [], indicators: [], portPlates: [], ...overrides };
}
