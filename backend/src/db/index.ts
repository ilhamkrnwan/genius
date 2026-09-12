import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const usePglite =
  process.env.DATABASE_DRIVER === "pglite" ||
  process.env.USE_PGLITE === "true" ||
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.startsWith("pglite");

let dbInstance: any;

if (usePglite) {
  const dataDir = path.resolve(import.meta.dir, "../../data/pglite_db");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);

  // Auto-run migration if tables not yet created
  const drizzleDir = path.resolve(import.meta.dir, "../../drizzle");
  const migrationFiles = fs.existsSync(drizzleDir)
    ? fs.readdirSync(drizzleDir).filter((f) => f.endsWith(".sql")).sort()
    : [];
  if (migrationFiles.length > 0) {
    try {
      const checkRes = await client.query<{ exists: boolean }>(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');"
      );
      if (!checkRes.rows[0]?.exists) {
        for (const file of migrationFiles) {
          const sql = fs.readFileSync(path.join(drizzleDir, file), "utf8");
          await client.exec(sql);
          console.log(`[DB] PGlite schema initialized from migration ${file}.`);
        }
      }
    } catch (err: any) {
      console.warn("[DB] PGlite table check warning:", err.message);
    }
  }

  // Ensure attendance_sessions table, columns, and enums exist in PGlite
  try {
    // These profile columns were added after the initial local PGlite schema.
    // Keep this migration separate so an enum compatibility warning cannot
    // prevent the user table from being upgraded.
    await client.exec(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "faculty" varchar(255);
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prodi" varchar(255);
    `);
  } catch (e: any) {
    console.warn("[DB] User profile compatibility migration warning:", e.message);
  }
  try {
    await client.exec(`
      ALTER TYPE "game_type" ADD VALUE IF NOT EXISTS 'FLAPPY_BIRD';
      CREATE TABLE IF NOT EXISTS "attendance_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "type" varchar(50) DEFAULT 'CHECK_IN' NOT NULL,
        "is_active" boolean DEFAULT false NOT NULL,
        "qr_token" varchar(255) NOT NULL,
        "xp_reward" integer DEFAULT 100 NOT NULL,
        "allow_late" boolean DEFAULT true NOT NULL,
        "late_time" varchar(10) DEFAULT '07:30',
        "start_time" timestamp with time zone,
        "end_time" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "session_id" uuid REFERENCES "attendance_sessions"("id") ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS "attendances_session_idx" ON "attendances" ("session_id");
      CREATE INDEX IF NOT EXISTS "attendance_sessions_active_idx" ON "attendance_sessions" ("is_active");
      CREATE INDEX IF NOT EXISTS "attendance_sessions_type_idx" ON "attendance_sessions" ("type");
    `);
  } catch (e: any) {
    console.warn("[DB] Attendance sessions & enum setup warning:", e.message);
  }

  dbInstance = drizzlePglite(client, { schema });
} else {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, {
    max: Number(process.env.DB_MAX_CONNECTIONS || 25),
    idle_timeout: 30,
    connect_timeout: 10,
  });
  dbInstance = drizzlePg(client, { schema });
}

export const db = dbInstance;
export type Database = typeof db;
