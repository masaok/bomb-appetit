import type {
  RealtimeEventName,
  RealtimeEvents,
  RealtimeMessage,
  RealtimePublisher,
  RealtimeSubscriber,
} from "./adapter";

/** In-process pub/sub. Used by tests, and on the server when no provider is configured. */
export class MemoryRealtime implements RealtimePublisher, RealtimeSubscriber {
  private listeners = new Map<string, Set<(message: RealtimeMessage) => void>>();

  async publish<E extends RealtimeEventName>(channel: string, event: E, payload: RealtimeEvents[E]) {
    const message = { event, payload } as RealtimeMessage;
    for (const listener of this.listeners.get(channel) ?? []) listener(message);
  }

  subscribe(channel: string, onMessage: (message: RealtimeMessage) => void) {
    const set = this.listeners.get(channel) ?? new Set();
    set.add(onMessage);
    this.listeners.set(channel, set);
    return () => {
      set.delete(onMessage);
    };
  }
}
