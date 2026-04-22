import 'dotenv/config'
import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import pkg from 'pg'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Worker uses ioredis directly so BullMQ has a single Redis client type.
const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null
    })

redisConnection.on('error', (error) => {
  console.error('Redis connection error:', error)
})

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const query = async (text, params) => {
  return pool.query(text, params)
}

/**
 * Process a CAD upload job and persist the result back to the jobs table.
 */
async function processDXF(job) {
  try {
    const { projectId, fileId, filePath, originalName } = job.data

    console.log(`Processing CAD file: ${originalName || filePath}`)

    await query(
      'UPDATE jobs SET status = $1, started_at = CURRENT_TIMESTAMP WHERE job_id = $2',
      ['processing', job.id]
    )

    const result = await processDXFWithPython(filePath, projectId, fileId)

    await query(
      `UPDATE jobs
       SET status = $1,
           result = $2,
           completed_at = CURRENT_TIMESTAMP,
           progress = 100
       WHERE job_id = $3`,
      ['completed', JSON.stringify(result), job.id]
    )

    await job.updateProgress(100)

    console.log(`Processing completed for ${originalName || filePath}`)
    return result
  } catch (error) {
    console.error(`Processing failed for job ${job.id}:`, error)

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
 * Execute the Python processing wrapper expected by the queue contract:
 * python processing/process.py <filePath>
 */
function processDXFWithPython(filePath, projectId, fileId) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../processing/process.py')
    const outputDir = path.resolve(process.env.OUTPUT_DIR || path.join(__dirname, '../../backend/outputs'))
    const pythonBinary = process.env.PYTHON_PATH || 'python'

    console.log(`Starting Python processing: ${pythonBinary} ${pythonScript} ${filePath}`)

    const python = spawn(pythonBinary, [pythonScript, filePath], {
      env: {
        ...process.env,
        OUTPUT_DIR: outputDir,
        PROJECT_ID: projectId,
        FILE_ID: fileId
      }
    })

    let output = ''
    let errorOutput = ''

    python.stdout.on('data', (data) => {
      output += data.toString()
      console.log(`[Python] ${data.toString().trimEnd()}`)
    })

    python.stderr.on('data', (data) => {
      errorOutput += data.toString()
      console.error(`[Python Error] ${data.toString().trimEnd()}`)
    })

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim().split('\n').pop())
          resolve(result)
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${err.message}. Output: ${output}`))
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`))
      }
    })

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`))
    })
  })
}

/**
 * Create and start worker on the shared BullMQ queue.
 */
function startWorker() {
  const worker = new Worker('cad-processing', processDXF, {
    connection: redisConnection,
    concurrency: 2,
    settings: {
      maxStalledCount: 2,
      stalledInterval: 5000
    }
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id || 'unknown'} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  console.log('Worker started on queue cad-processing, waiting for jobs...')

  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await worker.close()
    redisConnection.disconnect()
    await pool.end()
    process.exit(0)
  })
}

startWorker()
