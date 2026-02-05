-- CreateTable User
CREATE TABLE "users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "navn" VARCHAR(100) NOT NULL,
    "efternavn" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "telefon" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_email_telefon_key" UNIQUE("email", "telefon")
);

-- CreateIndex on User
CREATE INDEX "users_telefon_idx" ON "users"("telefon");
CREATE INDEX "users_navn_idx" ON "users"("navn");

-- AlterTable Booking
ALTER TABLE "bookings" ADD COLUMN "userId" INTEGER;

-- CreateIndex on Booking userId
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
