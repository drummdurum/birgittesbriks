-- Add blocked_times table
CREATE TABLE IF NOT EXISTS "blocked_times" (
    "id" SERIAL PRIMARY KEY,
    "date" DATE NOT NULL,
    "time" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("date", "time")
);

CREATE INDEX IF NOT EXISTS "idx_blocked_times_date_time" ON "blocked_times" ("date", "time");
