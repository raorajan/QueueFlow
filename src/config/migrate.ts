import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE;

if (!connectionString) {
  throw new Error("DATABASE environment variable is not set");
}

const dbUrl = connectionString.replace(/^'|'$/g, "");

const runMigration = async () => {
  console.log("Starting database migration...");
  
  // Use max 1 connection for migrations
  const migrationClient = postgres(dbUrl, { max: 1, prepare: false });
  const db = drizzle(migrationClient);

  try {
    // This will run migrations on the database, fetching them from the './drizzle' folder
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Error applying migrations:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
};

runMigration();
