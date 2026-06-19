import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE;

if (!connectionString) {
  throw new Error("DATABASE environment variable is not set");
}

// Strip quotes if any
const dbUrl = connectionString.replace(/^'|'$/g, "");

export default defineConfig({
  schema: "./src/models/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
