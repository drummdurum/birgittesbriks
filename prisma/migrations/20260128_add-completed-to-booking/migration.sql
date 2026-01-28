-- Migration: add 'completed' boolean column to bookings
-- Date: 2026-01-28

BEGIN;

-- Add column with default false (NOT NULL)
ALTER TABLE "bookings" ADD COLUMN "completed" boolean NOT NULL DEFAULT false;

-- Ensure any existing NULLs are set to false (defensive)
UPDATE "bookings" SET "completed" = false WHERE "completed" IS NULL;

COMMIT;
