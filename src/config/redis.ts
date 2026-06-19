import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redis.on("connect", () => {
  logger.info("Connected to Redis successfully.");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});

export default redis;
