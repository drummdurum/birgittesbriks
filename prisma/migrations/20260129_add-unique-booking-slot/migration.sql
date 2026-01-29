-- Create unique partial index to prevent double bookings for same slot (excluding cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_slot ON bookings (ønsket_dato, ønsket_tid)
WHERE ønsket_dato IS NOT NULL AND ønsket_tid IS NOT NULL AND status != 'cancelled';
