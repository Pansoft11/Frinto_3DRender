/**
 * Editor utilities and helper functions
 */

// Furniture catalog with dimensions and properties
export const FURNITURE_CATALOG = {
  sofa: {
    label: 'Sofa',
    dimensions: { width: 0.8, height: 0.4, depth: 0.8 },
    color: '#8B4513',
    category: 'seating'
  },
  bed: {
    label: 'Bed',
    dimensions: { width: 1.6, height: 0.6, depth: 1.2 },
    color: '#D4A574',
    category: 'bedroom'
  },
  table: {
    label: 'Table',
    dimensions: { width: 1.0, height: 0.3, depth: 0.8 },
    color: '#654321',
    category: 'dining'
  },
  chair: {
    label: 'Chair',
    dimensions: { width: 0.5, height: 0.8, depth: 0.5 },
    color: '#8B6914',
    category: 'seating'
  },
  lamp: {
    label: 'Lamp',
    dimensions: { width: 0.2, height: 0.8, depth: 0.2 },
    color: '#FFD700',
    category: 'lighting'
  },
  fan: {
    label: 'Fan',
    dimensions: { width: 0.6, height: 0.4, depth: 0.6 },
    color: '#A9A9A9',
    category: 'appliances'
  },
  cabinet: {
    label: 'Cabinet',
    dimensions: { width: 1.0, height: 1.5, depth: 0.5 },
    color: '#8B6F47',
    category: 'storage'
  },
  plant: {
    label: 'Plant',
    dimensions: { width: 0.3, height: 0.8, depth: 0.3 },
    color: '#228B22',
    category: 'decoration'
  }
}

/**
 * Convert RGB color to hex
 */
export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Clamp value between min and max
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value))
}

/**
 * Distance between two 3D points
 */
export const distance3D = (p1, p2) => {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const dz = p2[2] - p1[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Check if two objects collide (AABB)
 */
export const checkCollision = (obj1, obj2) => {
  const scale = 0.5 // Half-extents
  
  const box1 = {
    min: [obj1.position[0] - scale, obj1.position[1] - scale, obj1.position[2] - scale],
    max: [obj1.position[0] + scale, obj1.position[1] + scale, obj1.position[2] + scale]
  }
  
  const box2 = {
    min: [obj2.position[0] - scale, obj2.position[1] - scale, obj2.position[2] - scale],
    max: [obj2.position[0] + scale, obj2.position[1] + scale, obj2.position[2] + scale]
  }
  
  return (
    box1.min[0] < box2.max[0] &&
    box1.max[0] > box2.min[0] &&
    box1.min[1] < box2.max[1] &&
    box1.max[1] > box2.min[1] &&
    box1.min[2] < box2.max[2] &&
    box1.max[2] > box2.min[2]
  )
}

/**
 * Snap position to grid
 */
export const snapToGrid = (value, gridSize = 0.5) => {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Format vector for display
 */
export const formatVector = (vector, decimals = 2) => {
  return vector
    .map((v) => typeof v === 'number' ? v.toFixed(decimals) : v)
    .join(', ')
}

/**
 * Export scene to JSON
 */
export const exportSceneJSON = (objects, baseModel) => {
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    baseModel: baseModel ? { url: baseModel.url } : null,
    objects: objects.map((obj) => ({
      id: obj.id,
      type: obj.type,
      position: obj.position,
      rotation: obj.rotation,
      scale: obj.scale,
      color: obj.color,
      metadata: obj.metadata || {}
    }))
  }
}

/**
 * Import scene from JSON
 */
export const importSceneJSON = (json) => {
  if (!json.objects || !Array.isArray(json.objects)) {
    throw new Error('Invalid JSON format')
  }

  return json.objects.map((obj) => ({
    id: obj.id || `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: obj.type || 'furniture',
    position: obj.position || [0, 0, 0],
    rotation: obj.rotation || [0, 0, 0],
    scale: obj.scale || [1, 1, 1],
    color: obj.color || '#8B8B8B',
    metadata: obj.metadata || obj.properties || {},
    properties: obj.properties || obj.metadata || {}
  }))
}

/**
 * Group objects by category for library
 */
/**
 * Group objects by category for library
 */
export const groupByCategory = (items) => {
  return items.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})
}

/**
 * Snap position to ground (y = 0)
 */
export const snapToGround = (position) => {
  return [position[0], 0, position[2]]
}

/**
 * Clamp position to ground (y >= 0)
 */
export const clampToGround = (position) => {
  return [position[0], Math.max(0, position[1]), position[2]]
}

/**
 * Convert rotation from radians to degrees
 */
export const radToDeg = (rad) => {
  return rad * (180 / Math.PI)
}

/**
 * Convert rotation from degrees to radians
 */
export const degToRad = (deg) => {
  return deg * (Math.PI / 180)
}

/**
 * Calculate bounding box for collection of objects
 */
export const calculateBoundingBox = (objects) => {
  if (objects.length === 0) {
    return { min: [0, 0, 0], max: [0, 0, 0] }
  }

  let min = [...objects[0].position]
  let max = [...objects[0].position]

  objects.forEach((obj) => {
    min = [
      Math.min(min[0], obj.position[0]),
      Math.min(min[1], obj.position[1]),
      Math.min(min[2], obj.position[2])
    ]
    max = [
      Math.max(max[0], obj.position[0]),
      Math.max(max[1], obj.position[1]),
      Math.max(max[2], obj.position[2])
    ]
  })

  return { min, max }
}

/**
 * Center of bounding box
 */
export const getBoundingBoxCenter = (bbox) => {
  return [
    (bbox.min[0] + bbox.max[0]) / 2,
    (bbox.min[1] + bbox.max[1]) / 2,
    (bbox.min[2] + bbox.max[2]) / 2
  ]
}

/**
 * Size of bounding box
 */
export const getBoundingBoxSize = (bbox) => {
  return [
    Math.abs(bbox.max[0] - bbox.min[0]),
    Math.abs(bbox.max[1] - bbox.min[1]),
    Math.abs(bbox.max[2] - bbox.min[2])
  ]
}

/**
 * Format number for display as decimal places
 */
export const formatNumber = (num, decimals = 2) => {
  return Number(num).toFixed(decimals)
}

/**
 * Validate object has required properties
 */
export const isValidObject = (obj) => {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.position) &&
    obj.position.length === 3 &&
    Array.isArray(obj.rotation) &&
    obj.rotation.length === 3 &&
    Array.isArray(obj.scale) &&
    obj.scale.length === 3 &&
    typeof obj.color === 'string' &&
    typeof obj.type === 'string'
  )
}

/**
 * Deep copy object for history
 */
export const deepCopyObject = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}
