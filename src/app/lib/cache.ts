import { connectRedis, redis } from "../config/redis";
export const HOTEL_LIST_CACHE_TTL = 300;

const ensureRedis = async () => {
  if (!redis.isOpen) {
    await connectRedis();
  }
};

export const Cache = {
  async get<T>(key: string): Promise<T | null> {
    await ensureRedis();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key: string, value: unknown, ttlSeconds?: number) {
    await ensureRedis();
    await redis.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  },

  async sAdd(key: string, value: string) {
    await ensureRedis();
    await redis.sAdd(key, value);
  },

  async sMembers(key: string) {
    await ensureRedis();
    return redis.sMembers(key);
  },

  async sRem(key: string, member: string) {
    await ensureRedis();
    return redis.sRem(key, member);
  },

  async expire(key: string, seconds: number) {
    await ensureRedis();
    await redis.expire(key, seconds);
  },

  async del(key: string) {
    await ensureRedis();
    await redis.del(key);
  },

  async delMany(keys: string[]) {
    await ensureRedis();
    if (!keys.length) return;
    await redis.del(keys);
  },

  async delByPattern(pattern: string) {
    await ensureRedis();
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  },
};
