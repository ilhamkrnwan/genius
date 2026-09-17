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

const userProfileCompatibilitySql = `
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "faculty" varchar(255);
  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prodi" varchar(255);
`;

const ormawaCompatibilitySql = `
  ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'ORMAWA_PIC';
  ALTER TYPE "game_type" ADD VALUE IF NOT EXISTS 'FLAPPY_BIRD';
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "pic_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "logo_url" text;
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "tagline" text;
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "activities" jsonb DEFAULT '[]'::jsonb NOT NULL;
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "requirements" jsonb DEFAULT '[]'::jsonb NOT NULL;
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "stamp_instructions" jsonb DEFAULT '[]'::jsonb NOT NULL;
  ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(30);
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
  CREATE TABLE IF NOT EXISTS "ormawa_interests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "participant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "booth_id" uuid NOT NULL REFERENCES "ormawa_booths"("id") ON DELETE CASCADE,
    "phone_number" varchar(30) NOT NULL,
    "motivation" text,
    "experience" text,
    "instagram_username" varchar(100),
    "xp_bonus_earned" integer DEFAULT 3 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );
  ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "session_id" uuid REFERENCES "attendance_sessions"("id") ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS "attendances_session_idx" ON "attendances" ("session_id");
  CREATE INDEX IF NOT EXISTS "attendance_sessions_active_idx" ON "attendance_sessions" ("is_active");
  CREATE INDEX IF NOT EXISTS "attendance_sessions_type_idx" ON "attendance_sessions" ("type");
  CREATE UNIQUE INDEX IF NOT EXISTS "ormawa_interest_unique" ON "ormawa_interests" ("participant_id", "booth_id");
  CREATE INDEX IF NOT EXISTS "ormawa_interest_participant_idx" ON "ormawa_interests" ("participant_id");
  CREATE INDEX IF NOT EXISTS "ormawa_interest_booth_idx" ON "ormawa_interests" ("booth_id");
  ALTER TABLE "ormawa_interests" ADD COLUMN IF NOT EXISTS "instagram_username" varchar(100);
  UPDATE "ormawa_booths"
    SET "stamp_instructions" = '["Datangi stan dan kenali program Ormawa atau UKM.","Selesaikan misi yang diberikan oleh PIC stan.","Buka QR profilmu dan minta PIC memindainya untuk menerima stamp."]'::jsonb
    WHERE jsonb_array_length("stamp_instructions") = 0;
  ALTER TABLE "ormawa_booths" ALTER COLUMN "xp_reward" SET DEFAULT 2;
  ALTER TABLE "ormawa_scans" ALTER COLUMN "xp_earned" SET DEFAULT 2;
  ALTER TABLE "ormawa_interests" ALTER COLUMN "xp_bonus_earned" SET DEFAULT 3;
  UPDATE "ormawa_booths" SET "xp_reward" = 2 WHERE "xp_reward" = 75;
  UPDATE "ormawa_scans" SET "xp_earned" = 2 WHERE "xp_earned" = 75;
  UPDATE "ormawa_interests" SET "xp_bonus_earned" = 3 WHERE "xp_bonus_earned" = 25;
  UPDATE "score_transactions" SET "amount" = 2
    WHERE "amount" = 75 AND "reason" LIKE 'Kunjungan Stan Ormawa:%';
  UPDATE "score_transactions" SET "amount" = 3
    WHERE "amount" = 25 AND "reason" LIKE 'Pendaftaran Minat Ormawa:%';
`;

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
    await client.exec(userProfileCompatibilitySql);
  } catch (e: any) {
    console.warn("[DB] User profile compatibility migration warning:", e.message);
  }
  try {
    await client.exec(ormawaCompatibilitySql);
  } catch (e: any) {
    console.warn("[DB] Ormawa compatibility setup warning:", e.message);
  }

  dbInstance = drizzlePglite(client, { schema });
} else {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, {
    max: Number(process.env.DB_MAX_CONNECTIONS || 25),
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: () => {},
  });

  // Docker/PostgreSQL also needs the same additive compatibility migration.
  // All statements are idempotent and preserve existing records.
  try {
    await client.unsafe(userProfileCompatibilitySql);
    await client.unsafe(ormawaCompatibilitySql);
  } catch (e: any) {
    console.warn("[DB] PostgreSQL compatibility migration warning:", e.message);
  }
  dbInstance = drizzlePg(client, { schema });
}

export const db = dbInstance;
export type Database = typeof db;
