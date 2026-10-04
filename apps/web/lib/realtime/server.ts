import "server-only";
import Pusher from "pusher";
import { env } from "@/lib/server/env";
import type { RealtimeEventName, RealtimeEvents, RealtimePublisher } from "./adapter";
import { MemoryRealtime } from "./memory";

let pusher: Pusher | null = null;

function pusherClient(): Pusher | null {
  if (!env.pusher) return null;
  pusher ??= new Pusher({
    appId: env.pusher.appId,
    key: env.pusher.key,
    secret: env.pusher.secret,
    cluster: env.pusher.cluster,
    useTLS: true,
  });
  return pusher;
}

const memory = new MemoryRealtime();

/** Publishes through Pusher when configured. Without it, clients fall back to polling the room. */
export const realtime: RealtimePublisher = {
  async publish<E extends RealtimeEventName>(channel: string, event: E, payload: RealtimeEvents[E]) {
    const client = pusherClient();
    if (!client) return memory.publish(channel, event, payload);
    try {
      await client.trigger(channel, event, payload);
    } catch (error) {
      // A missed push is recoverable (clients also poll), so it must not fail the request.
      console.error("realtime publish failed", { channel, event, error: String(error) });
    }
  },
};

/** Signs a presence-channel subscription for one room member. Null when realtime is off. */
export function authorizeChannel(
  socketId: string,
  channel: string,
  member: { id: string; name: string; role: string },
): object | null {
  const client = pusherClient();
  if (!client) return null;
  return client.authorizeChannel(socketId, channel, {
    user_id: member.id,
    user_info: { name: member.name, role: member.role },
  });
}
