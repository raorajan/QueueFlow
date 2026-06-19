import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "../config/redis";
import logger from "../utils/logger";

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Expected due to ioredis typings vs rate-limit-redis typings
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  handler: (req, res, next, options) => {
    logger.warn({ ip: req.ip }, "Rate limit exceeded");
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
});
