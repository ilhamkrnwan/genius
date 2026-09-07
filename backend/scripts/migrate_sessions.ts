import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dataDir = path.resolve(import.meta.dir, "../data/pglite_db");
  const client = new PGlite(dataDir);

  console.log("Creating attendance_sessions table in PGlite at:", dataDir);
  await client.exec(`
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
  console.log("✅ Successfully migrated attendance_sessions table!");
}

main().catch(console.error);
