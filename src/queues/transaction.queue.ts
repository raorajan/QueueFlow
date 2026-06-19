import { Queue } from "bullmq";
import redis from "../config/redis";

export const TRANSACTION_QUEUE_NAME = "transaction-queue";

export const transactionQueue = new Queue(TRANSACTION_QUEUE_NAME, {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000, // 1000ms, 2000ms, 4000ms...
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
