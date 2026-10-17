require('dotenv').config();
const { initDbConnection } = require('./db');

async function main() {
  console.log('[Migration] Checking and migrating Neon PostgreSQL database...');
  const success = await initDbConnection();
  if (success) {
    console.log('✅ [Migration] Complete. Database is ready.');
    process.exit(0);
  } else {
    console.log('ℹ️ [Migration] Neon database is either not configured or unreachable. Check your .env DATABASE_URL.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ [Migration] Fatal error:', err);
  process.exit(1);
});
