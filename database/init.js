const { pool } = require('./connection');
const fs = require('fs');
const path = require('path');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Create bookings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        navn VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        telefon VARCHAR(20) NOT NULL,
        ønsket_dato DATE,
        ønsket_tid VARCHAR(20),
        behandling_type VARCHAR(50) DEFAULT 'Enkelt behandling',
        besked TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        gdpr_samtykke BOOLEAN NOT NULL DEFAULT false,
        created_by_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create blocked_dates table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_dates (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes if they don't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
      CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
      CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
      CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(ønsket_dato, ønsket_tid);
      CREATE INDEX IF NOT EXISTS idx_blocked_dates_range ON blocked_dates(start_date, end_date);
    `);
    
    // Create trigger function if it doesn't exist
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger if it doesn't exist
    await pool.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      CREATE TRIGGER update_bookings_updated_at 
          BEFORE UPDATE ON bookings 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ Database schema created successfully');
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
};

module.exports = { initDatabase };