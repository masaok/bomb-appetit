"use client";

import type { RealtimeEventName, RealtimeMessage, RealtimeSubscriber } from "./adapter";

const EVENTS: RealtimeEventName[] = ["room:update", "game:start", "game:status", "game:end", "room:reset"];

const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

/**
 * The browser side of the realtime seam, backed by Pusher Channels. Null when no
 * provider is configured; callers then rely on polling alone.
 */
export const realtimeClient: RealtimeSubscriber | null =
  key && cluster
    ? {
        subscribe(channelName, onMessage, onPresence) {
          let stopped = false;
          let disconnect = () => {};

          // Loaded on demand so pages without a room never download the client.
          void import("pusher-js").then(({ default: Pusher }) => {
            if (stopped) return;
            const pusher = new Pusher(key, {
              cluster,
              channelAuthorization: { endpoint: "/api/realtime/token", transport: "ajax" },
            });
            const channel = pusher.subscribe(channelName);
            for (const event of EVENTS) {
              // The server is the only publisher and types every payload it sends.
              channel.bind(event, (payload: unknown) => onMessage({ event, payload } as RealtimeMessage));
            }
            const members = () => {
              const ids: string[] = [];
              (
                channel as unknown as { members?: { each(fn: (m: { id: string }) => void): void } }
              ).members?.each((m) => ids.push(m.id));
              onPresence?.(ids);
            };
            for (const event of [
              "pusher:subscription_succeeded",
              "pusher:member_added",
              "pusher:member_removed",
            ]) {
              channel.bind(event, members);
            }
            disconnect = () => pusher.disconnect();
          });

          return () => {
            stopped = true;
            disconnect();
          };
        },
      }
    : null;
