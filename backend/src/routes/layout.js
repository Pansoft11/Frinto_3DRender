/**
 * Layout saving and loading routes
 */
import express from 'express'
import { query } from '../db/db.js'
import * as layoutController from '../controllers/layoutController.js'

const router = express.Router()

/**
 * Save layout customization
 */
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const layoutData = req.body

    if (!layoutData) {
      return res.status(400).json({ error: 'Layout data required' })
    }

    // Verify project access
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if layout exists
    const existingLayout = await query(
      'SELECT id, version FROM layouts WHERE project_id = $1 ORDER BY version DESC LIMIT 1',
      [projectId]
    )

    let result

    if (existingLayout.rows.length > 0) {
      // Update existing layout
      const newVersion = existingLayout.rows[0].version + 1
      result = await query(
        `UPDATE layouts 
         SET layout_data = $1, 
             version = $2, 
             saved_by = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE project_id = $4
         RETURNING id, project_id, version, saved_at, updated_at`,
        [JSON.stringify(layoutData), newVersion, req.userId, projectId]
      )
    } else {
      // Create new layout
      result = await query(
        `INSERT INTO layouts (project_id, layout_data, saved_by)
         VALUES ($1, $2, $3)
         RETURNING id, project_id, version, saved_at, updated_at`,
        [projectId, JSON.stringify(layoutData), req.userId]
      )
    }

    res.json({
      message: 'Layout saved',
      layout: result.rows[0]
    })
  } catch (error) {
    console.error('Error saving layout:', error)
    res.status(500).json({ error: 'Failed to save layout' })
  }
})

/**
 * Load latest layout
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project access
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get latest layout
    const result = await query(
      `SELECT layout_data, version, saved_at, updated_at 
       FROM layouts 
       WHERE project_id = $1 
       ORDER BY version DESC 
       LIMIT 1`,
      [projectId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No layout found' })
    }

    res.json(result.rows[0].layout_data)
  } catch (error) {
    console.error('Error loading layout:', error)
    res.status(500).json({ error: 'Failed to load layout' })
  }
})

/**
 * Get layout history
 */
router.get('/:projectId/history', async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project access
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get layout versions
    const result = await query(
      `SELECT id, version, saved_at, updated_at, 
              (SELECT username FROM users WHERE id = saved_by) as saved_by
       FROM layouts 
       WHERE project_id = $1 
       ORDER BY version DESC`,
      [projectId]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching layout history:', error)
    res.status(500).json({ error: 'Failed to fetch layout history' })
  }
})

/**
 * Delete layout
 */
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project access
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await query(
      'DELETE FROM layouts WHERE project_id = $1',
      [projectId]
    )

    res.json({ message: 'Layout deleted' })
  } catch (error) {
    console.error('Error deleting layout:', error)
    res.status(500).json({ error: 'Failed to delete layout' })
  }
})

/**
 * Get room details and classification for the latest completed project processing
 */
router.get('/:projectId/rooms', layoutController.getRooms)

/**
 * Get suggested furniture layout from the latest completed processing job
 */
router.get('/:projectId/suggested', layoutController.getSuggestedLayout)

/**
 * Get layout metadata and statistics
 */
router.get('/:projectId/stats', layoutController.getLayoutStats)

/**
 * Export layout JSON directly from the latest completed processing job
 */
router.get('/:projectId/export', layoutController.exportLayout)

export default router
