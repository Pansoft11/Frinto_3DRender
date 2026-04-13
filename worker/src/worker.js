import 'dotenv/config'
import { Worker, Queue } from 'bullmq'
import redis from 'redis'
import pkg from 'pg'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Redis connection
const redisConnection = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

await redisConnection.connect()

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const query = async (text, params) => {
  return pool.query(text, params)
}

/**
 * Process DXF file job
 */
async function processDXF(job) {
  try {
    const { projectId, fileId, filePath, originalName } = job.data

    console.log(`🔄 Processing DXF: ${originalName}`)

    // Update job status
    await query(
      'UPDATE jobs SET status = $1, started_at = CURRENT_TIMESTAMP WHERE job_id = $2',
      ['processing', job.id]
    )

    // Call Python processing script
    const result = await processDXFWithPython(filePath, projectId, fileId)

    // Update job with results
    await query(
      `UPDATE jobs 
       SET status = $1, 
           result = $2, 
           completed_at = CURRENT_TIMESTAMP, 
           progress = 100
       WHERE job_id = $3`,
      ['completed', JSON.stringify(result), job.id]
    )

    // Update job progress
    job.progress(100)

    console.log(`✅ Processing completed for ${originalName}`)
    return result
  } catch (error) {
    console.error(`❌ Processing failed: ${error.message}`)

    // Update job with error
    await query(
      `UPDATE jobs 
       SET status = $1, 
           error_message = $2, 
           completed_at = CURRENT_TIMESTAMP
       WHERE job_id = $3`,
      ['failed', error.message, job.id]
    )

    throw error
  }
}

/**
 * Call Python script to process DXF
 */
function processDXFWithPython(filePath, projectId, fileId) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../processing/main.py')
    const outputDir = path.join(__dirname, '../../outputs')
    const pythonBinary = process.env.PYTHON_PATH || 'python'

    const python = spawn(pythonBinary, [
      pythonScript,
      '--input', filePath,
      '--output', outputDir,
      '--project-id', projectId
    ])

    let output = ''
    let errorOutput = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
      console.log(`[Python] ${data}`)
    })

    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
      console.error(`[Python Error] ${data}`)
    })

    python.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse Python output (should be JSON)
          const result = JSON.parse(output.trim().split('\n').pop())
          resolve(result)
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${err.message}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`))
      }
    })

    python.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Create and start worker
 */
function startWorker() {
  const worker = new Worker('dxf-processing', processDXF, {
    connection: redisConnection,
    concurrency: 2,
    settings: {
      maxStalledCount: 2,
      stalledInterval: 5000
    }
  })

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  console.log('🚀 Worker started, waiting for jobs...')

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await worker.close()
    await redisConnection.quit()
    await pool.end()
    process.exit(0)
  })
}

// Start worker
startWorker()
