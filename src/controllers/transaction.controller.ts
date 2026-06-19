import { Request, Response, NextFunction } from "express";
import { transactionQueue } from "../queues/transaction.queue";
import redis from "../config/redis";
import { db } from "../config/db";
import { transactions } from "../models/schema";
import { eq, desc, sum } from "drizzle-orm";
import logger from "../utils/logger";

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    
    logger.info({ txId: payload.id }, "Adding transaction to queue");
    
    await transactionQueue.add("process-transaction", payload, {
      jobId: payload.id,
    });

    res.status(200).json({
      success: true,
      message: "Transaction queued successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const CACHE_KEY = "analytics:summary";
    const LOCK_KEY = "analytics:summary:lock";
    
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      logger.info("Serving analytics from cache");
      return res.status(200).json(JSON.parse(cachedData));
    }
    const acquiredLock = await redis.set(LOCK_KEY, "locked", "EX", 10, "NX");

    if (!acquiredLock) {
      logger.info("Cache stampede protected: Waiting for lock release.");
      
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const retryCache = await redis.get(CACHE_KEY);
      if (retryCache) {
        return res.status(200).json(JSON.parse(retryCache));
      } else {
        return res.status(503).json({ success: false, message: "Service busy processing analytics, please try again." });
      }
    }

    try {
      logger.info("Lock acquired: Fetching analytics from Database (Simulating slow query...)");

      await new Promise(resolve => setTimeout(resolve, 2000));

      const totalVolumeResult = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(eq(transactions.status, "SUCCESS"));
        
      const totalVolume = totalVolumeResult[0]?.total ? parseFloat(totalVolumeResult[0].total as string) : 0;

      const topUsersResult = await db
        .select({
          userId: transactions.userId,
          volume: sum(transactions.amount),
        })
        .from(transactions)
        .where(eq(transactions.status, "SUCCESS"))
        .groupBy(transactions.userId)
        .orderBy(desc(sum(transactions.amount)))
        .limit(5);

      const topUsers = topUsersResult.map(tu => ({
        userId: tu.userId,
        volume: tu.volume ? parseFloat(tu.volume as string) : 0,
      }));

      const result = { totalVolume, topUsers };

      await redis.set(CACHE_KEY, JSON.stringify(result), "EX", 60);

      res.status(200).json(result);
    } finally {
      await redis.del(LOCK_KEY);
    }
  } catch (error) {
    next(error);
  }
};
