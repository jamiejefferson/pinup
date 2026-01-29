import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client singleton
 * Uses the KV_REST_API_URL and KV_REST_API_TOKEN environment variables
 * (same as Vercel KV used to use, for compatibility)
 */
let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      // In development without KV, we'll use a mock
      console.warn('KV_REST_API_URL or KV_REST_API_TOKEN not set. Using in-memory storage.');
      return createMockRedis();
    }

    redis = new Redis({
      url,
      token,
    });
  }
  return redis;
}

/**
 * Key prefix constants
 */
export const KEYS = {
  comment: (id: string) => `comment:${id}`,
  projectVersionComments: (projectId: string, versionId: string) => 
    `project:${projectId}:version:${versionId}:comments`,
};

/**
 * In-memory mock for development without Redis
 */
const memoryStore: Map<string, string | Set<string>> = new Map();

function createMockRedis(): Redis {
  return {
    get: async (key: string) => {
      const value = memoryStore.get(key);
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    },
    set: async (key: string, value: unknown) => {
      memoryStore.set(key, JSON.stringify(value));
      return 'OK';
    },
    del: async (key: string) => {
      memoryStore.delete(key);
      return 1;
    },
    sadd: async (key: string, ...members: string[]) => {
      let set = memoryStore.get(key);
      if (!(set instanceof Set)) {
        set = new Set<string>();
        memoryStore.set(key, set);
      }
      members.forEach(m => (set as Set<string>).add(m));
      return members.length;
    },
    srem: async (key: string, ...members: string[]) => {
      const set = memoryStore.get(key);
      if (set instanceof Set) {
        members.forEach(m => set.delete(m));
        return members.length;
      }
      return 0;
    },
    smembers: async (key: string) => {
      const set = memoryStore.get(key);
      if (set instanceof Set) {
        return Array.from(set);
      }
      return [];
    },
  } as unknown as Redis;
}
