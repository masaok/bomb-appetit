import { expect, it } from "vitest";
import type { RealtimeMessage } from "./adapter";
import { MemoryRealtime } from "./memory";

it("delivers published events to subscribers of that channel only, until they unsubscribe", async () => {
  const bus = new MemoryRealtime();
  const heard: RealtimeMessage[] = [];
  const other: RealtimeMessage[] = [];
  const stop = bus.subscribe("presence-room-ABCDE", (m) => heard.push(m));
  bus.subscribe("presence-room-ZZZZZ", (m) => other.push(m));

  await bus.publish("presence-room-ABCDE", "game:start", { ruleSeed: 7, startedAt: "2026-10-03T00:00:00Z" });
  stop();
  await bus.publish("presence-room-ABCDE", "room:reset", {});

  expect(heard).toEqual([{ event: "game:start", payload: { ruleSeed: 7, startedAt: "2026-10-03T00:00:00Z" } }]);
  expect(other).toEqual([]);
});
