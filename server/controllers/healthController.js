import { pool } from "../config/database.js";

export async function healthCheck(_request, response) {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({ status: "error", database: "disconnected" });
  }
}
