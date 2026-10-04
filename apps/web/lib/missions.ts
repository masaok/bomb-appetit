import { isModuleId, MODULES, validateSpec, type BombSpec, type ModuleId } from "@bombappetit/engine";
import { z } from "zod";
import section1 from "@/data/missions/section-1.json" with { type: "json" };
import section2 from "@/data/missions/section-2.json" with { type: "json" };
import section3 from "@/data/missions/section-3.json" with { type: "json" };
import section4 from "@/data/missions/section-4.json" with { type: "json" };

const moduleId = z.custom<ModuleId>(isModuleId, "unknown module");

const missionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  blurb: z.string().min(1),
  section: z.int().min(1).max(4),
  order: z.int().min(1),
  caseSize: z.enum(["3x2", "4x3"]),
  timeLimitMs: z.int().positive(),
  strikeLimit: z.int().min(1).max(5),
  modulePool: z.array(moduleId).min(1),
  moduleCount: z.int().min(1),
  needyPool: z.array(moduleId),
  needyCount: z.int().min(0),
  /** A fixed seed makes a mission the same bomb for everyone (used for the tutorial). */
  fixedBombSeed: z.int().nonnegative().nullable(),
  ruleSeed: z.int().min(1),
});

export type Mission = z.infer<typeof missionSchema>;

export const SECTION_TITLES: Record<number, string> = {
  1: "Appetizers",
  2: "Main course",
  3: "House specials",
  4: "Chef's table",
};

export function missionSpec(mission: Mission, bombSeed: number): BombSpec {
  return {
    bombSeed: mission.fixedBombSeed ?? bombSeed,
    ruleSeed: mission.ruleSeed,
    timeLimitMs: mission.timeLimitMs,
    strikeLimit: mission.strikeLimit,
    caseSize: mission.caseSize,
    moduleCount: mission.moduleCount,
    modulePool: mission.modulePool,
    needyCount: mission.needyCount,
    needyPool: mission.needyPool,
  };
}

// The JSON files are data someone edits by hand, so they are parsed like any other input.
// A bad mission fails the build instead of a player's game.
export const MISSIONS: Mission[] = z
  .array(missionSchema)
  .parse([...section1, ...section2, ...section3, ...section4])
  .sort((a, b) => a.section - b.section || a.order - b.order);

for (const mission of MISSIONS) {
  const problem = validateSpec(missionSpec(mission, 0));
  if (problem) throw new Error(`Mission ${mission.id}: ${problem}`);
}
if (new Set(MISSIONS.map((m) => m.id)).size !== MISSIONS.length)
  throw new Error("Mission ids must be unique");

export function missionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function moduleNames(ids: ModuleId[]): string {
  return ids.map((id) => MODULES[id].name).join(", ");
}
