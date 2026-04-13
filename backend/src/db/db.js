import pg from 'pg'

const { Pool } = pg

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err)
})

export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    if (duration > 100) {
      console.log('Executed query', { text, duration, rows: res.rowCount })
    }
    return res
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

export const getClient = async () => {
  return pool.connect()
}

export default pool
