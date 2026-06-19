import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE;

if (!connectionString) {
  throw new Error("DATABASE environment variable is not set");
}

const dbUrl = connectionString.replace(/^'|'$/g, "");
export const client = postgres(dbUrl, { prepare: false });
export const db = drizzle(client);

export const connectDB = async () => {
  try {
    // Simple query to test the connection
    await client`SELECT 1`;
    console.log("PostgreSQL Database Connected Successfully");
  } catch (error) {
    console.error("Failed to connect to PostgreSQL Database:", error);
    process.exit(1);
  }
};
