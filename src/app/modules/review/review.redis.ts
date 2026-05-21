import { createClient, RedisClientType } from 'redis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is missing in .env');
}

// 1. Client toiri kora
export const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

// 2. Error listener (Connect korar agei set korte hoy)
redis.on('error', (err) => {
  console.error('[Redis] Connection Error ❌', err.message);
});

// 3. Connect kora (Official 'redis' package-e explicitly call korte hoy)
redis.connect()
  .then(() => {
    console.log('[Redis] Connected Successfully ✅');
  })
  .catch((err) => {
    console.error('[Redis] Connection Failed ❌', err.message);
  });

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;

    // String theke object-e convert kora
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`[Redis] cacheGet failed "${key}":`, err);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  try {
    const stringValue = JSON.stringify(value);

    // Official redis package-e options evabe object er vitore dite hoy
    await redis.set(key, stringValue, {
      EX: ttlSeconds
    });
  } catch (err) {
    console.error(`[Redis] cacheSet failed "${key}":`, err);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length === 0) return;
    // Official redis package-e del er bhitore array pass kora jay
    await redis.del(keys);
  } catch (err) {
    console.error(`[Redis] cacheDel failed "${keys.join(', ')}":`, err);
  }
}

export const CacheKeys = {
  hotelReviews: (hotelId: string) => `reviews:hotel:${hotelId}`,
} as const;