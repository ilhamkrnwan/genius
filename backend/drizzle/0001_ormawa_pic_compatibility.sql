ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'ORMAWA_PIC';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "faculty" varchar(255);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "prodi" varchar(255);
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "pic_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "logo_url" text;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "tagline" text;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "activities" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "requirements" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "stamp_instructions" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(30);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ormawa_interests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "participant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "booth_id" uuid NOT NULL REFERENCES "ormawa_booths"("id") ON DELETE CASCADE,
  "phone_number" varchar(30) NOT NULL,
  "instagram_username" varchar(100),
  "motivation" text,
  "experience" text,
  "xp_bonus_earned" integer DEFAULT 3 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ormawa_interest_unique" ON "ormawa_interests" ("participant_id", "booth_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ormawa_interest_participant_idx" ON "ormawa_interests" ("participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ormawa_interest_booth_idx" ON "ormawa_interests" ("booth_id");
--> statement-breakpoint
ALTER TABLE "ormawa_interests" ADD COLUMN IF NOT EXISTS "instagram_username" varchar(100);
--> statement-breakpoint
UPDATE "ormawa_booths"
SET "stamp_instructions" = '["Datangi stan dan kenali program Ormawa atau UKM.","Selesaikan misi yang diberikan oleh PIC stan.","Buka QR profilmu dan minta PIC memindainya untuk menerima stamp."]'::jsonb
WHERE jsonb_array_length("stamp_instructions") = 0;
--> statement-breakpoint
ALTER TABLE "ormawa_booths" ALTER COLUMN "xp_reward" SET DEFAULT 2;
--> statement-breakpoint
ALTER TABLE "ormawa_scans" ALTER COLUMN "xp_earned" SET DEFAULT 2;
--> statement-breakpoint
ALTER TABLE "ormawa_interests" ALTER COLUMN "xp_bonus_earned" SET DEFAULT 3;
--> statement-breakpoint
UPDATE "ormawa_booths" SET "xp_reward" = 2 WHERE "xp_reward" = 75;
--> statement-breakpoint
UPDATE "ormawa_scans" SET "xp_earned" = 2 WHERE "xp_earned" = 75;
--> statement-breakpoint
UPDATE "ormawa_interests" SET "xp_bonus_earned" = 3 WHERE "xp_bonus_earned" = 25;
--> statement-breakpoint
UPDATE "score_transactions" SET "amount" = 2 WHERE "amount" = 75 AND "reason" LIKE 'Kunjungan Stan Ormawa:%';
--> statement-breakpoint
UPDATE "score_transactions" SET "amount" = 3 WHERE "amount" = 25 AND "reason" LIKE 'Pendaftaran Minat Ormawa:%';
