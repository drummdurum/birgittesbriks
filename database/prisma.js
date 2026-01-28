const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
require('dotenv').config();

const prisma = new PrismaClient();

// Create a pool connection for session store (needed for connect-pg-simple)
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);

// Test database connection
const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
};

module.exports = {
  prisma,
  pool,
  testConnection
};
