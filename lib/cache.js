// Simple in-memory cache for frequently accessed data
class Cache {
  constructor() {
    this.store = new Map();
    this.ttl = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    this.store.set(key, value);
    this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
  }

  get(key) {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.delete(key);
      return null;
    }
    return this.store.get(key);
  }

  delete(key) {
    this.store.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.store.clear();
    this.ttl.clear();
  }

  has(key) {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.delete(key);
      return false;
    }
    return this.store.has(key);
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }
}

const cache = new Cache();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => cache.cleanup(), 5 * 60 * 1000);
}

export default cache;

// Helper function to wrap database calls with caching
export async function withCache(key, fetchFn, ttlSeconds = 300) {
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  cache.set(key, data, ttlSeconds);
  return data;
}
