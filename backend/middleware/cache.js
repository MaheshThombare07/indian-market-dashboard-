/**
 * Simple in-memory cache with TTL.
 *
 * Usage:
 *   const cache = new MemoryCache(60_000); // 60s TTL
 *   cache.get('key')        // → value or undefined
 *   cache.set('key', value) // stores with timestamp
 *   cache.isValid('key')    // → Boolean
 */

class MemoryCache {
  constructor(defaultTTL = 60_000) {
    this.defaultTTL = defaultTTL;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > this.defaultTTL) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttl) {
    this.store.set(key, {
      value,
      ts: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  isValid(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    return Date.now() - entry.ts <= (entry.ttl ?? this.defaultTTL);
  }

  /** Return raw entry (for polling to check staleness) */
  getEntry(key) {
    return this.store.get(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = MemoryCache;
