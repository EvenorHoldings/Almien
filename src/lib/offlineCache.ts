// Tiny localStorage JSON cache used for offline 7-day schedule sync.
// Keys are namespaced under "almien:cache:".

const PREFIX = 'almien:cache:';

export interface CacheEnvelope<T> {
  v: 1;
  fetchedAt: number;          // epoch ms
  ttlMs: number;              // soft TTL (advisory)
  data: T;
}

export function cacheGet<T>(key: string): CacheEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (parsed?.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs = 60 * 60 * 1000): void {
  try {
    const env: CacheEnvelope<T> = { v: 1, fetchedAt: Date.now(), ttlMs, data };
    localStorage.setItem(PREFIX + key, JSON.stringify(env));
  } catch {
    /* quota / privacy mode — silently ignore */
  }
}

export function cacheIsFresh<T>(env: CacheEnvelope<T> | null): boolean {
  if (!env) return false;
  return Date.now() - env.fetchedAt < env.ttlMs;
}

export function cacheClear(key: string): void {
  try { localStorage.removeItem(PREFIX + key); } catch { /* noop */ }
}
