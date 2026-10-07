import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required. Configure it in your .env file.");
}

export const pool = new Pool({
  connectionString,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
