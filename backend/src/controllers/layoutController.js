/**
 * Layout Controller - Handles layout-related operations
 * Manages retrieval and manipulation of room layouts and furniture suggestions
 */

import { query } from '../db/db.js'

/**
 * Get layout data for a project
 */
export const getLayout = async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or access denied' })
    }

    // Get latest completed job
    const jobResult = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [projectId]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No completed processing job found' })
    }

    const job = jobResult.rows[0]

    if (!job.result || !job.result.layout) {
      return res.status(404).json({ error: 'Layout data not available' })
    }

    // Return comprehensive layout data
    res.json({
      projectId,
      layout: job.result.layout,
      rooms: job.result.rooms || [],
      geometry: job.result.geometry || {},
      generatedAt: job.completed_at,
      jobId: job.job_id,
      status: 'success'
    })
  } catch (error) {
    console.error('Error fetching layout:', error)
    res.status(500).json({ error: 'Failed to fetch layout' })
  }
}

/**
 * Get room details for a project
 */
export const getRooms = async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or access denied' })
    }

    // Get latest completed job
    const jobResult = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [projectId]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No completed processing job found' })
    }

    const job = jobResult.rows[0]

    if (!job.result || !job.result.rooms) {
      return res.status(404).json({ error: 'Room data not available' })
    }

    // Return room details with statistics
    const rooms = job.result.rooms
    const roomStats = rooms.reduce((acc, room) => {
      acc[room.type] = (acc[room.type] || 0) + 1
      return acc
    }, {})

    res.json({
      projectId,
      rooms,
      statistics: {
        totalRooms: rooms.length,
        byType: roomStats,
        totalArea: rooms.reduce((sum, room) => sum + (room.area || 0), 0).toFixed(2)
      },
      generatedAt: job.completed_at
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
}

/**
 * Get suggested furniture layout
 */
export const getSuggestedLayout = async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or access denied' })
    }

    // Get latest completed job
    const jobResult = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [projectId]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No completed processing job found' })
    }

    const job = jobResult.rows[0]

    if (!job.result || !job.result.layout) {
      return res.status(404).json({ error: 'Suggested layout not available' })
    }

    // Return suggested furniture
    res.json({
      projectId,
      suggestedLayout: job.result.layout.suggestedLayout || [],
      statistics: job.result.layout.statistics || {},
      generatedAt: job.completed_at
    })
  } catch (error) {
    console.error('Error fetching suggested layout:', error)
    res.status(500).json({ error: 'Failed to fetch suggested layout' })
  }
}

/**
 * Get layout statistics
 */
export const getLayoutStats = async (req, res) => {
  try {
    const { projectId } = req.params

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or access denied' })
    }

    // Get latest completed job
    const jobResult = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [projectId]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No completed processing job found' })
    }

    const job = jobResult.rows[0]

    if (!job.result) {
      return res.status(404).json({ error: 'Processing result not available' })
    }

    const { rooms, geometry, layout } = job.result

    // Calculate room statistics
    const roomStats = {
      total: rooms?.length || 0,
      byType: rooms?.reduce((acc, room) => {
        acc[room.type] = (acc[room.type] || 0) + 1
        return acc
      }, {}) || {},
      totalArea: rooms?.reduce((sum, room) => sum + (room.area || 0), 0).toFixed(2) || 0,
      averageArea: rooms ? (rooms.reduce((sum, room) => sum + (room.area || 0), 0) / rooms.length).toFixed(2) : 0,
      averageConfidence: rooms
        ? (rooms.reduce((sum, room) => sum + (room.confidence || 0), 0) / rooms.length).toFixed(2)
        : 0
    }

    // Calculate furniture statistics
    const furnitureStats = {
      suggested: layout?.suggestedLayout?.length || 0,
      byType: layout?.suggestedLayout?.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {}) || {}
    }

    res.json({
      projectId,
      geometry: geometry || {},
      rooms: roomStats,
      furniture: furnitureStats,
      layout: {
        suggestedFurnitureCount: layout?.suggestedFurnitureCount || 0,
        ...layout?.statistics
      },
      generatedAt: job.completed_at,
      processingTime: job.completed_at && job.started_at
        ? new Date(job.completed_at) - new Date(job.started_at)
        : null
    })
  } catch (error) {
    console.error('Error fetching layout stats:', error)
    res.status(500).json({ error: 'Failed to fetch layout statistics' })
  }
}

/**
 * Export layout for use in external tools
 */
export const exportLayout = async (req, res) => {
  try {
    const { projectId } = req.params
    const { format = 'json' } = req.query

    // Verify project belongs to user
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    )

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'Project not found or access denied' })
    }

    // Get latest completed job
    const jobResult = await query(
      `SELECT * FROM jobs 
       WHERE project_id = $1 AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [projectId]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'No completed processing job found' })
    }

    const job = jobResult.rows[0]

    if (!job.result) {
      return res.status(404).json({ error: 'Layout data not available' })
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="layout-${projectId}.json"`)

    // Create complete export object
    const exportData = {
      projectId,
      exportedAt: new Date().toISOString(),
      format: 'layout-v1',
      data: {
        rooms: job.result.rooms || [],
        suggestedLayout: job.result.layout?.suggestedLayout || [],
        geometry: job.result.geometry || {}
      },
      metadata: {
        totalRooms: job.result.rooms?.length || 0,
        suggestedFurniture: job.result.layout?.suggestedLayout?.length || 0,
        processingTime: job.completed_at && job.started_at
          ? new Date(job.completed_at) - new Date(job.started_at)
          : null
      }
    }

    res.json(exportData)
  } catch (error) {
    console.error('Error exporting layout:', error)
    res.status(500).json({ error: 'Failed to export layout' })
  }
}
