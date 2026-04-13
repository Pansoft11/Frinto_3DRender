/**
 * 3D Model management for furniture and objects
 * Provides GLTF model loading, caching, and fallback geometries
 */

const MODEL_CACHE = {}

/**
 * Model definitions with URLs and fallback geometries
 */
export const MODEL_DEFINITIONS = {
  sofa: {
    url: '/models/sofa.glb',
    label: 'Sofa',
    scale: [0.8, 0.4, 0.8],
    color: '#8B4513',
    fallback: 'box',
    fallbackScale: [0.8, 0.4, 0.8]
  },
  bed: {
    url: '/models/bed.glb',
    label: 'Bed',
    scale: [1.6, 0.6, 1.2],
    color: '#D4A574',
    fallback: 'box',
    fallbackScale: [1.6, 0.6, 1.2]
  },
  table: {
    url: '/models/table.glb',
    label: 'Table',
    scale: [1.0, 0.3, 0.8],
    color: '#654321',
    fallback: 'box',
    fallbackScale: [1.0, 0.3, 0.8]
  },
  chair: {
    url: '/models/chair.glb',
    label: 'Chair',
    scale: [0.5, 0.8, 0.5],
    color: '#8B6914',
    fallback: 'box',
    fallbackScale: [0.5, 0.8, 0.5]
  },
  lamp: {
    url: '/models/lamp.glb',
    label: 'Lamp',
    scale: [0.2, 0.8, 0.2],
    color: '#FFD700',
    fallback: 'cylinder',
    fallbackScale: [0.2, 0.8, 0.2],
    emissive: '#FFD700',
    emissiveIntensity: 0.5
  },
  fan: {
    url: '/models/fan.glb',
    label: 'Fan',
    scale: [0.6, 0.4, 0.6],
    color: '#A9A9A9',
    fallback: 'box',
    fallbackScale: [0.6, 0.4, 0.6]
  },
  cabinet: {
    url: '/models/cabinet.glb',
    label: 'Cabinet',
    scale: [1.0, 1.5, 0.5],
    color: '#8B6F47',
    fallback: 'box',
    fallbackScale: [1.0, 1.5, 0.5]
  },
  plant: {
    url: '/models/plant.glb',
    label: 'Plant',
    scale: [0.3, 0.8, 0.3],
    color: '#228B22',
    fallback: 'cone',
    fallbackScale: [0.3, 0.8, 0.3]
  }
}

/**
 * Load GLTF model with caching and FBX/OBJ fallback support
 * Falls back to geometric primitives if model not found
 */
export const loadModel = async (type) => {
  const def = MODEL_DEFINITIONS[type]
  if (!def) return null

  // Check cache first
  if (MODEL_CACHE[type]) {
    return MODEL_CACHE[type]
  }

  try {
    // Try dynamic import of GLTFLoader
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader')
    const loader = new GLTFLoader()

    return new Promise((resolve, reject) => {
      loader.load(
        def.url,
        (gltf) => {
          // Cache and return
          MODEL_CACHE[type] = gltf.scene
          resolve(gltf.scene)
        },
        undefined,
        (error) => {
          console.warn(`Failed to load ${type} model, using fallback:`, error)
          // Return fallback geometry info
          resolve(null)
        }
      )
    })
  } catch (error) {
    console.warn(`GLTFLoader not available for ${type}, using fallback`)
    return null
  }
}

/**
 * Get fallback geometry for a model type
 */
export const getFallbackGeometry = (type) => {
  const def = MODEL_DEFINITIONS[type]
  if (!def) return 'box'
  return def.fallback
}

/**
 * Get model scale for a type
 */
export const getModelScale = (type) => {
  const def = MODEL_DEFINITIONS[type]
  return def?.fallbackScale || [1, 1, 1]
}

/**
 * Get material properties for a model type
 */
export const getModelMaterial = (type, color) => {
  const def = MODEL_DEFINITIONS[type]
  return {
    color: color || def?.color || '#8B8B8B',
    emissive: def?.emissive || '#000000',
    emissiveIntensity: def?.emissiveIntensity || 0,
    metalness: 0.1,
    roughness: 0.8
  }
}

/**
 * Preload multiple models for faster loading
 */
export const preloadModels = async (types = Object.keys(MODEL_DEFINITIONS)) => {
  const promises = types.map((type) => loadModel(type))
  return Promise.allSettled(promises)
}

/**
 * Clear model cache
 */
export const clearModelCache = () => {
  Object.keys(MODEL_CACHE).forEach((key) => {
    delete MODEL_CACHE[key]
  })
}

/**
 * Get all available model types
 */
export const getAvailableModels = () => {
  return Object.keys(MODEL_DEFINITIONS)
}
