import { randomUUID } from "node:crypto";

const STATE_TTL_MS = 5 * 60 * 1000;

type StateEntry<T> = { payload: T; expiresAt: number };

/**
 * Generic CSRF-state store for OAuth authorization-code flows. Each provider
 * (Google, GitHub, ...) gets its own instance so state tokens can't be replayed
 * across providers, and each can carry provider-specific payload (e.g. GitHub
 * needs to remember which organization initiated the connection).
 */
export function createOAuthStateStore<T>() {
  const pending = new Map<string, StateEntry<T>>();

  function pruneExpired() {
    const now = Date.now();
    for (const [state, entry] of pending) {
      if (entry.expiresAt <= now) pending.delete(state);
    }
  }

  function create(payload: T) {
    pruneExpired();
    const state = randomUUID();
    pending.set(state, { payload, expiresAt: Date.now() + STATE_TTL_MS });
    return state;
  }

  function consume(state: unknown): T | null {
    if (typeof state !== "string" || !state) return null;
    const entry = pending.get(state);
    pending.delete(state);
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return entry.payload;
  }

  return { create, consume };
}
