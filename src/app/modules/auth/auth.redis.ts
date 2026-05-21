import statusCode from "http-status";
import { redis } from "../../config/redis";
import AppError from "../../utils/AppError";
import AuthKeys from "./auth.keys";
import { Cache } from "../../lib/cache";

const authLimit = async (ip: string, email: string, limit: number) => {
  const key = AuthKeys.authLimit(ip, email);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  if (count > limit)
    throw new AppError(
      statusCode.TOO_MANY_REQUESTS,
      "Too many request attempts!",
    );
};

const coolDownOtp = async (email: string) => {
  const key = AuthKeys.coolDownOtp(email);
  const exist = await Cache.get(key);
  if (exist)
    throw new AppError(
      statusCode.TOO_MANY_REQUESTS,
      "Please wait before enable to resend!",
    );
  await Cache.set(key, "1", 60);
};

const addSession = async (
  hashedRefreshToken: string,
  userId: string,
  session: { [key: string]: string | Date },
) => {
  const key = AuthKeys.authSession(hashedRefreshToken);
  const sessionKeys = AuthKeys.sessionKeys(userId);
  await Promise.all([
    Cache.set(key, session, 3600 * 24),
    Cache.sAdd(sessionKeys, key),
    Cache.expire(sessionKeys, 3600 * 24),
  ]);
};

const removeSession = async (userId: string) => {
  const sessionKeys = AuthKeys.sessionKeys(userId);
  const sessionIds = await Cache.sMembers(sessionKeys);
  if (!sessionIds.length) return;
  await Promise.all([Cache.delMany(sessionIds), Cache.del(sessionKeys)]);
};

const AuthRedis = {
  authLimit,
  coolDownOtp,
  addSession,
  removeSession,
};
export default AuthRedis;
