import app from "./app";
import dotenv from "dotenv";
import { connectDB, client } from "./config/db";
import redis from "./config/redis";
import { transactionWorker } from "./workers/transaction.worker";
import { transactionQueue } from "./queues/transaction.queue";
import logger from "./utils/logger";

dotenv.config();

const port = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    server.close(() => {
      logger.info("Express server closed");
    });

    try {
      await transactionWorker.close();
      logger.info("BullMQ Worker closed");

      await transactionQueue.close();
      logger.info("BullMQ Queue closed");

      redis.disconnect();
      logger.info("Redis connection closed");

      await client.end();
      logger.info("PostgreSQL connection closed");

      logger.info("Shutdown complete.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();