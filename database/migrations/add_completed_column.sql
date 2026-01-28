-- Add completed column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
