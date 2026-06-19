import { 
  pgTable, 
  uuid, 
  varchar, 
  numeric, 
  timestamp, 
  integer, 
  text 
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).unique(),
  walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 100 }).primaryKey(), // Transaction ID from payload
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  transactionTimestamp: timestamp("transaction_timestamp").notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, PROCESSING, SUCCESS, FAILED
  retryCount: integer("retry_count").default(0).notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactionLogs = pgTable("transaction_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 100 }).references(() => transactions.id).notNull(),
  event: varchar("event", { length: 50 }).notNull(), // QUEUED, PROCESSING, SUCCESS, FAILED, RETRY_1, etc.
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
