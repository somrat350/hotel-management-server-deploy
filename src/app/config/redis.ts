import { createClient, RedisClientType } from "redis";
import ENV from "./env";

let redisClient: RedisClientType | null = null;
let isConnecting: boolean = false;

const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({
      url: ENV.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Error:", err);
    });

    console.log("Redis instance created.");
  }

  return redisClient;
};

export const connectRedis = async () => {
  const client = getRedisClient();
  if (client.isOpen) return;

  if (!isConnecting) {
    isConnecting = true;

    try {
      await client.connect();
      console.log("✅ Redis connected.");
    } catch (err) {
      console.error("❌ Redis connection failed:", err);
      throw err;
    } finally {
      isConnecting = false;
    }
  }

  return client;
};

export const redis: RedisClientType = getRedisClient();

process.on("SIGINT", async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    console.log("🛑 Redis disconnected (app shutdown).");
  }
});
