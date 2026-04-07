-- Make booking note non-null with empty-string default
ALTER TABLE "bookings" ALTER COLUMN "besked" SET DEFAULT '';
UPDATE "bookings" SET "besked" = '' WHERE "besked" IS NULL;
ALTER TABLE "bookings" ALTER COLUMN "besked" SET NOT NULL;
