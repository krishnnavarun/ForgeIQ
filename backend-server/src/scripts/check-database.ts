import "dotenv/config";
import { database } from "../config/database.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured. Add it to backend-server/.env before running db:check.");
  process.exitCode = 1;
} else {
  try {
    await database.$connect();
    console.info("Database connection successful.");
  } catch (error) {
    console.error("Database connection failed.", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await database.$disconnect();
  }
}