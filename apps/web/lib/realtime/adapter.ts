/**
 * The realtime seam. Everything the app publishes or hears goes through these two
 * interfaces, so the provider (Pusher today) can be swapped and tests can run in memory.
 */

/** The only bomb facts Experts ever receive. Module contents and edgework stay on the Defuser's screen. */
export interface GameStatus {
  remainingMs: number;
  strikes: number;
  strikeLimit: number;
  solved: number;
  total: number;
  needyActive: boolean;
}

export interface RealtimeEvents {
  /** Players, roles or setup changed. Listeners refetch the room. */
  "room:update": Record<string, never>;
  "game:start": { ruleSeed: number; startedAt: string };
  "game:status": GameStatus;
  "game:end": { result: string; reason: string; timeRemainingMs: number; runId: string | null };
  "room:reset": Record<string, never>;
}

export type RealtimeEventName = keyof RealtimeEvents;

export type RealtimeMessage = {
  [E in RealtimeEventName]: { event: E; payload: RealtimeEvents[E] };
}[RealtimeEventName];

export interface RealtimePublisher {
  publish<E extends RealtimeEventName>(channel: string, event: E, payload: RealtimeEvents[E]): Promise<void>;
}

export interface RealtimeSubscriber {
  /** Returns an unsubscribe function. */
  subscribe(
    channel: string,
    onMessage: (message: RealtimeMessage) => void,
    onPresence?: (memberIds: string[]) => void,
  ): () => void;
}

export function roomChannel(code: string): string {
  return `presence-room-${code}`;
}
