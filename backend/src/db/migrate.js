/**
 * Database initialization script
 * Run with: npm run migrate
 */
import 'dotenv/config'
import { initializeDatabase } from './schema.js'

try {
  await initializeDatabase()
  console.log('✅ Migration completed')
  process.exit(0)
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
}
