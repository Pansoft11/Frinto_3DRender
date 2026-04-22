/**
 * File upload and processing routes
 */
import express from 'express'
import { Queue } from 'bullmq'
import { query } from '../db/db.js'
import { redisConnection } from '../config/redis.js'
import upload from '../middleware/upload.js'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Queue name is shared with the worker.
const processingQueue = new Queue('cad-processing', {
  connection: redisConnection
})

/**
 * Upload DXF file and create processing job
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' })
    }

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or access denied' })
    }

    // Save file record to database
    const fileResult = await query(
      `INSERT INTO files (project_id, original_name, file_path, file_type, file_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, original_name, file_path, file_type, file_size`,
      [projectId, req.file.originalname, req.file.path, 'dxf', req.file.size]
    )

    const fileRecord = fileResult.rows[0]

    // Create processing job
    const job = await processingQueue.add(
      'process-dxf',
      {
        projectId,
        fileId: fileRecord.id,
        filePath: req.file.path,
        originalName: req.file.originalname
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: false
      }
    )

    // Save job reference to database
    await query(
      'INSERT INTO jobs (project_id, file_id, job_id, status) VALUES ($1, $2, $3, $4)',
      [projectId, fileRecord.id, job.id, 'pending']
    )

    res.status(201).json({
      file: fileRecord,
      jobId: job.id,
      job: {
        id: job.id,
        status: 'pending',
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
})

/**
 * Get processing job status
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const jobResult = await query(
      'SELECT * FROM jobs WHERE job_id = $1',
      [req.params.jobId]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const job = jobResult.rows[0]

    // Get BullMQ job for real-time status
    const bullJob = await processingQueue.getJob(req.params.jobId)

    res.json({
      ...job,
      progress: bullJob?.progress?.() || job.progress
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    res.status(500).json({ error: 'Failed to fetch job status' })
  }
})

/**
 * Get output file URL after processing
 */
router.get('/output/:projectId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [req.params.projectId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No completed jobs found' })
    }

    const job = result.rows[0]

    if (!job.result || !job.result.gltfPath) {
      return res.status(404).json({ error: 'GLTF not ready' })
    }

    res.json({
      gltfUrl: `/outputs/${path.basename(job.result.gltfPath)}`,
      layoutPath: job.result.layoutPath ? `/outputs/${path.basename(job.result.layoutPath)}` : null,
      job
    })
  } catch (error) {
    console.error('Error fetching output:', error)
    res.status(500).json({ error: 'Failed to fetch output' })
  }
})

/**
 * Get layout JSON data from a completed job
 */
router.get('/layout/:projectId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [req.params.projectId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No completed jobs found' })
    }

    const job = result.rows[0]

    if (!job.result || !job.result.layout) {
      return res.status(404).json({ error: 'Layout data not available' })
    }

    // Return the layout data including rooms and suggested furniture
    res.json({
      projectId: req.params.projectId,
      ...job.result.layout,
      generatedAt: job.completed_at,
      status: 'success'
    })
  } catch (error) {
    console.error('Error fetching layout:', error)
    res.status(500).json({ error: 'Failed to fetch layout' })
  }
})

/**
 * Get statistics about the processed layout
 */
router.get('/layout-stats/:projectId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [req.params.projectId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No completed jobs found' })
    }

    const job = result.rows[0]

    if (!job.result) {
      return res.status(404).json({ error: 'Process result not available' })
    }

    const { rooms, geometry, layout } = job.result

    res.json({
      projectId: req.params.projectId,
      geometry: geometry || {},
      rooms: {
        count: rooms?.length || 0,
        types: rooms?.reduce((acc, room) => {
          acc[room.type] = (acc[room.type] || 0) + 1
          return acc
        }, {}) || {}
      },
      layout: layout || {},
      generatedAt: job.completed_at
    })
  } catch (error) {
    console.error('Error fetching layout stats:', error)
    res.status(500).json({ error: 'Failed to fetch layout statistics' })
  }
})

export default router
