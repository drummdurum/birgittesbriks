const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:iTOwSnKVWgfUzFgFLNQoXrxMTtpPjgKi@switchyard.proxy.rlwy.net:54007/railway'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Forbundet til Railway PostgreSQL');

    const sql = `
      ALTER TABLE "bookings" RENAME COLUMN "behandling_type" TO "betaling";
      ALTER TABLE "bookings" ADD COLUMN "behandling" VARCHAR(50) DEFAULT 'Kropsterapi' NOT NULL;
      UPDATE "bookings" SET "behandling" = 'Kropsterapi' WHERE "behandling" IS NULL OR "behandling" = '';
    `;

    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
            console.log('ℹ️  Already exists:', statement.trim().substring(0, 50) + '...');
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Database migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
