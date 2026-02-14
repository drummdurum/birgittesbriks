require('dotenv').config();
const { Client } = require('pg');

const REQUIRED_TABLES = ['bookings', 'blocked_dates', 'blocked_times', 'users', 'session'];

const parseArgs = () => {
  const args = new Set(process.argv.slice(2));

  if (args.has('--all')) return { local: true, online: true };
  if (args.has('--online')) return { local: false, online: true };
  return { local: true, online: false };
};

const maskConnectionString = (connectionString) => {
  if (!connectionString) return '(missing)';

  try {
    const url = new URL(connectionString);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '(invalid connection string)';
  }
};

const isLocalHost = (connectionString) => {
  try {
    const url = new URL(connectionString);
    const host = (url.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
};

const createClient = (connectionString) => {
  const useSsl = !isLocalHost(connectionString);

  return new Client({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000
  });
};

const checkDatabase = async (name, connectionString) => {
  if (!connectionString) {
    return {
      ok: false,
      name,
      message: `Mangler connection string for ${name}`,
      details: null
    };
  }

  const client = createClient(connectionString);

  try {
    await client.connect();

    const identity = await client.query(`
      SELECT
        current_database() AS database_name,
        current_user AS user_name,
        version() AS db_version
    `);

    const tableResult = await client.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      ORDER BY table_name;
      `,
      [REQUIRED_TABLES]
    );

    const foundTables = tableResult.rows.map((row) => row.table_name);
    const missingTables = REQUIRED_TABLES.filter((table) => !foundTables.includes(table));

    return {
      ok: missingTables.length === 0,
      name,
      message: missingTables.length
        ? `Forbindelse OK, men manglende tabeller: ${missingTables.join(', ')}`
        : 'Forbindelse OK, alle forventede tabeller findes',
      details: {
        database: identity.rows[0]?.database_name,
        user: identity.rows[0]?.user_name,
        foundTables,
        missingTables
      }
    };
  } catch (error) {
    return {
      ok: false,
      name,
      message: error.message,
      details: null
    };
  } finally {
    await client.end().catch(() => {});
  }
};

const printResult = (result, connectionString) => {
  const icon = result.ok ? '✅' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   URL: ${maskConnectionString(connectionString)}`);
  console.log(`   Status: ${result.message}`);

  if (result.details) {
    console.log(`   Database: ${result.details.database}`);
    console.log(`   User: ${result.details.user}`);
    console.log(`   Tabeller fundet: ${result.details.foundTables.join(', ') || '(ingen)'}`);
  }
};

const main = async () => {
  const { local, online } = parseArgs();

  const localUrl = process.env.DATABASE_URL;
  const onlineUrl =
    process.env.ONLINE_DATABASE_URL ||
    process.env.PRODUCTION_DATABASE_URL ||
    process.env.RAILWAY_DATABASE_URL;

  const checks = [];
  if (local) checks.push({ name: 'Lokal database', url: localUrl });
  if (online) checks.push({ name: 'Online database', url: onlineUrl });

  if (!checks.length) {
    console.log('Ingen checks valgt. Brug --local, --online eller --all');
    process.exit(1);
  }

  console.log('🔍 Kører database-checks (read-only)...');

  const results = [];
  for (const check of checks) {
    const result = await checkDatabase(check.name, check.url);
    results.push({ result, url: check.url });
    printResult(result, check.url);
  }

  const hasErrors = results.some((entry) => !entry.result.ok);

  if (hasErrors) {
    console.log('\n⚠️ Mindst én database-check fejlede.');
    process.exit(1);
  }

  console.log('\n🎉 Alle valgte database-checks bestod.');
};

main().catch((error) => {
  console.error('Uventet fejl i database-check script:', error);
  process.exit(1);
});
