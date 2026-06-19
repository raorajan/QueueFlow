import { Worker, Job } from "bullmq";
import redis from "../config/redis";
import { TRANSACTION_QUEUE_NAME } from "../queues/transaction.queue";
import logger from "../utils/logger";
import { db } from "../config/db";
import { transactions, users, transactionLogs } from "../models/schema";
import { eq } from "drizzle-orm";

export const transactionWorker = new Worker(
  TRANSACTION_QUEUE_NAME,
  async (job: Job) => {
    const { id, userId, amount, currency, timestamp } = job.data;
    
    logger.info({ jobId: job.id, txId: id }, "Worker started processing job");

    // Simulated network delay (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Start DB Transaction
    await db.transaction(async (tx) => {
      // 1. Check idempotency
      const existingTx = await tx.select().from(transactions).where(eq(transactions.id, id)).limit(1);

      if (existingTx.length > 0) {
        if (existingTx[0].status === "SUCCESS") {
          logger.info({ txId: id }, "Transaction already processed successfully. Skipping.");
          return;
        }
      } else {
        // Insert as pending/processing if not exists
        await tx.insert(transactions).values({
          id,
          userId,
          amount: String(amount),
          currency,
          transactionTimestamp: new Date(timestamp),
          status: "PROCESSING",
          retryCount: job.attemptsMade,
        });
        
        await tx.insert(transactionLogs).values({
          transactionId: id,
          event: "PROCESSING",
          message: `Attempt ${job.attemptsMade + 1}`,
        });
      }

      // 2. Read user wallet
      const userRecords = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (userRecords.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      const user = userRecords[0];
      const currentBalance = parseFloat(user.walletBalance as string);

      if (currentBalance < amount) {
        await tx.update(transactions).set({ status: "FAILED", updatedAt: new Date(), retryCount: job.attemptsMade }).where(eq(transactions.id, id));
        await tx.insert(transactionLogs).values({ transactionId: id, event: "FAILED", message: "Insufficient balance" });
        throw new Error("Insufficient balance");
      }

      // 3. Deduct balance
      const newBalance = currentBalance - amount;
      await tx.update(users)
        .set({ walletBalance: String(newBalance), updatedAt: new Date() })
        .where(eq(users.id, userId));

      // 4. Update status
      await tx.update(transactions)
        .set({ status: "SUCCESS", processedAt: new Date(), updatedAt: new Date(), retryCount: job.attemptsMade })
        .where(eq(transactions.id, id));

      await tx.insert(transactionLogs).values({
        transactionId: id,
        event: "SUCCESS",
        message: "Wallet deducted and transaction completed",
      });
      
      logger.info({ txId: id, newBalance }, "Transaction completed successfully");
    });
  },
  {
    connection: redis as any,
    concurrency: 5, // Process up to 5 transactions concurrently
  }
);

transactionWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, txId: job.data.id }, "Job completed successfully");
});

transactionWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, txId: job?.data?.id, err: err.message }, "Job failed");
});
