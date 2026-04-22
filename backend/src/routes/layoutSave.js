/**
 * Compatibility save/load endpoints for editor layout JSON.
 * Existing authenticated /api/layout routes remain available.
 */
import express from 'express'
import { query } from '../db/db.js'

const router = express.Router()

router.post('/save-layout', async (req, res) => {
  try {
    const { projectId, layout, objects } = req.body
    const layoutData = layout || { objects: objects || [] }

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' })
    }

    const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [projectId])
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const latest = await query(
      'SELECT version FROM layouts WHERE project_id = $1 ORDER BY version DESC LIMIT 1',
      [projectId]
    )
    const nextVersion = latest.rows.length > 0 ? latest.rows[0].version + 1 : 1

    const result = await query(
      `INSERT INTO layouts (project_id, layout_data, version)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, version, saved_at, updated_at`,
      [projectId, JSON.stringify(layoutData), nextVersion]
    )

    res.status(201).json({
      message: 'Layout saved',
      layout: result.rows[0]
    })
  } catch (error) {
    console.error('Error saving layout:', error)
    res.status(500).json({ error: 'Failed to save layout' })
  }
})

router.get('/layout/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Treat :id as a project id first, then fall back to a layout row id.
    let result = await query(
      `SELECT id, project_id, layout_data, version, saved_at, updated_at
       FROM layouts
       WHERE project_id = $1
       ORDER BY version DESC
       LIMIT 1`,
      [id]
    )

    if (result.rows.length === 0) {
      result = await query(
        `SELECT id, project_id, layout_data, version, saved_at, updated_at
         FROM layouts
         WHERE id = $1
         LIMIT 1`,
        [id]
      )
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layout not found' })
    }

    const layout = result.rows[0]
    res.json({
      id: layout.id,
      projectId: layout.project_id,
      version: layout.version,
      savedAt: layout.saved_at,
      updatedAt: layout.updated_at,
      ...layout.layout_data
    })
  } catch (error) {
    console.error('Error loading layout:', error)
    res.status(500).json({ error: 'Failed to load layout' })
  }
})

export default router
