-- Rename behandling_type to betaling and make treatment fixed to Kropsterapi
ALTER TABLE "bookings" RENAME COLUMN "behandling_type" TO "betaling";
ALTER TABLE "bookings" ADD COLUMN "behandling" VARCHAR(50) DEFAULT 'Kropsterapi' NOT NULL;

-- Update all existing bookings to have treatment = Kropsterapi
UPDATE "bookings" SET "behandling" = 'Kropsterapi' WHERE "behandling" IS NULL OR "behandling" = '';
