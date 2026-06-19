import { z } from "zod";

export const transactionBodySchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  userId: z.string().uuid("Invalid User ID format"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  timestamp: z.string().datetime("Invalid ISO timestamp format"),
});

export type TransactionBody = z.infer<typeof transactionBodySchema>;
