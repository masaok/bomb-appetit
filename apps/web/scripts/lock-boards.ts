// Records each mission's board epoch and the fields it was opened with in
// data/missions/board-lock.json. Run it after raising a mission's boardEpoch or adding
// or removing a mission. It refuses to record a change that came without a new epoch.
//
//   pnpm boards:lock
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lockProblems, relock, type BoardLock } from "../lib/board-lock";
import { MISSIONS } from "../lib/missions";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/missions/board-lock.json");
const current = JSON.parse(readFileSync(file, "utf8")) as BoardLock;
const next = relock(MISSIONS, current);

const problems = lockProblems(MISSIONS, next);
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
writeFileSync(file, JSON.stringify(next, null, 2) + "\n");
console.log(`Locked ${Object.keys(next).length} boards.`);
