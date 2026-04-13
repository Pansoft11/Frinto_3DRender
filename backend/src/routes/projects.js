/**
 * Projects routes
 */
import express from 'express'
import { query } from '../db/db.js'

const router = express.Router()

/**
 * Get all projects for user
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, status, created_at, updated_at 
       FROM projects 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [req.userId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

/**
 * Get single project
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

/**
 * Create new project
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Project name required' })
    }

    const result = await query(
      `INSERT INTO projects (user_id, name, description) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, description, status, created_at, updated_at`,
      [req.userId, name, description || null]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

/**
 * Update project
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status } = req.body

    const result = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, name, description, status, created_at, updated_at`,
      [name || null, description || null, status || null, req.params.id, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

/**
 * Delete project
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router
