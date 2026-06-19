import { Router } from "express";
import { createTransaction, getAnalyticsSummary } from "../controllers/transaction.controller";
import { validateBody } from "../middleware/validate";
import { transactionBodySchema } from "../validators/transaction.schema";
import { apiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/transactions", apiRateLimiter, validateBody(transactionBodySchema), createTransaction);
router.get("/analytics/summary", apiRateLimiter, getAnalyticsSummary);

export default router;
