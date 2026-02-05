const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:iTOwSnKVWgfUzFgFLNQoXrxMTtpPjgKi@switchyard.proxy.rlwy.net:54007/railway'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Forbundet til Railway PostgreSQL');

    // SQL migration commands
    const sql = `
      -- CreateTable User
      CREATE TABLE IF NOT EXISTS "users" (
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
      CREATE INDEX IF NOT EXISTS "users_telefon_idx" ON "users"("telefon");
      CREATE INDEX IF NOT EXISTS "users_navn_idx" ON "users"("navn");

      -- AlterTable Booking - Add userId if it doesn't exist
      ALTER TABLE "bookings" ADD COLUMN "userId" INTEGER DEFAULT NULL;

      -- CreateIndex on Booking userId
      CREATE INDEX IF NOT EXISTS "bookings_userId_idx" ON "bookings"("userId");

      -- AddForeignKey - Create constraint if it doesn't exist
      ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    `;

    // Execute each statement separately
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ Executed:', statement.trim().substring(0, 50) + '...');
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
            console.log('ℹ️  Already exists:', statement.trim().substring(0, 50) + '...');
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
