import { create } from 'zustand'

/**
 * Zustand store for editor state management
 * Manages selected objects, objects list, transformations, and undo/redo
 */
export const useEditorStore = create((set, get) => {
  // History stack for undo/redo
  let history = []
  let historyIndex = -1
  const MAX_HISTORY = 50

  const saveToHistory = (state) => {
    // Remove any redo history after current index
    history = history.slice(0, historyIndex + 1)
    
    // Save state snapshot
    history.push({
      objects: JSON.parse(JSON.stringify(state.objects)),
      selected: state.selected ? { ...state.selected } : null
    })
    
    historyIndex = history.length - 1
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift()
      historyIndex--
    }
  }

  const restoreFromHistory = (index) => {
    if (index < 0 || index >= history.length) return
    historyIndex = index
    const snapshot = history[index]
    return {
      objects: JSON.parse(JSON.stringify(snapshot.objects)),
      selected: snapshot.selected ? { ...snapshot.selected } : null
    }
  }

  return {
    // State
    selected: null,
    objects: [],
    baseModel: null,
    camera: { position: [8, 6, 8], target: [0, 0, 0] },
    transformMode: 'translate', // translate, rotate, scale
    snapEnabled: true,
    snapGrid: 0.5,
    
    // Selection
    setSelected: (obj) => set({ selected: obj }),
    clearSelection: () => set({ selected: null }),
    
    // Transform mode control
    setTransformMode: (mode) => set({ transformMode: mode }),
    toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
    
    // Object management with history
    addObject: (obj) =>
      set((state) => {
        const newObj = {
          ...obj,
          id: obj.id || `obj-${Date.now()}-${Math.random()}`,
          position: obj.position || [0, 0, 0],
          rotation: obj.rotation || [0, 0, 0],
          scale: obj.scale || [1, 1, 1],
          color: obj.color || '#8B8B8B',
          type: obj.type || 'furniture',
          // Type-specific properties (initialized as empty)
          properties: obj.properties || {}
        }
        
        const newState = {
          objects: [...state.objects, newObj],
          selected: newObj
        }
        
        saveToHistory(newState)
        return newState
      }),

    updateObject: (id, updates) =>
      set((state) => {
        const updatedObjects = state.objects.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        )
        
        // Snap to grid if enabled
        if (state.snapEnabled && updates.position) {
          const snapGrid = state.snapGrid
          updatedObjects[updatedObjects.findIndex((o) => o.id === id)].position = 
            updates.position.map((p) => Math.round(p / snapGrid) * snapGrid)
        }
        
        // Snap to ground (y=0)
        if (updates.position && updates.position[1] < 0) {
          const objIndex = updatedObjects.findIndex((o) => o.id === id)
          updatedObjects[objIndex].position[1] = 0
        }
        
        // Also update selected if it's the same object
        const updatedSelected = state.selected?.id === id 
          ? updatedObjects.find((o) => o.id === id)
          : state.selected

        const newState = {
          objects: updatedObjects,
          selected: updatedSelected
        }

        saveToHistory(newState)
        return newState
      }),

    deleteObject: (id) =>
      set((state) => {
        const newState = {
          objects: state.objects.filter((o) => o.id !== id),
          selected: state.selected?.id === id ? null : state.selected
        }
        
        saveToHistory(newState)
        return newState
      }),

    setBaseModel: (model) => set({ baseModel: model }),

    // Batch operations
    setObjects: (objects) => set((state) => {
      const newState = { objects }
      saveToHistory(newState)
      return newState
    }),
    
    // Camera
    setCamera: (camera) => set({ camera }),

    // Undo/Redo
    undo: () =>
      set((state) => {
        if (historyIndex > 0) {
          const restored = restoreFromHistory(historyIndex - 1)
          return restored || state
        }
        return state
      }),

    redo: () =>
      set((state) => {
        if (historyIndex < history.length - 1) {
          const restored = restoreFromHistory(historyIndex + 1)
          return restored || state
        }
        return state
      }),

    canUndo: () => historyIndex > 0,
    canRedo: () => historyIndex < history.length - 1,

    // Clear all
    reset: () => set({
      selected: null,
      objects: [],
      baseModel: null,
      camera: { position: [8, 6, 8], target: [0, 0, 0] },
      transformMode: 'translate',
      snapEnabled: true
    })
  }
})

/**
 * Zustand store for layout/project state
 */
export const useProjectStore = create((set) => ({
  projectId: null,
  projectName: 'Untitled Project',
  savedLayout: null,
  isSaving: false,
  lastSave: null,

  setProject: (id, name) => set({ projectId: id, projectName: name }),
  
  setSaving: (saving) => set({ isSaving: saving }),
  
  setSavedLayout: (layout) => set({ 
    savedLayout: layout,
    lastSave: new Date().toISOString()
  }),

  reset: () => set({
    projectId: null,
    projectName: 'Untitled Project',
    savedLayout: null,
    isSaving: false,
    lastSave: null
  })
}))

/**
 * Zustand store for UI state (panels, modals)
 */
export const useUIStore = create((set) => ({
  showFurnitureLibrary: true,
  showProperties: true,
  showStats: false,
  activeModal: null,
  notification: null,

  setShowFurnitureLibrary: (show) => set({ showFurnitureLibrary: show }),
  setShowProperties: (show) => set({ showProperties: show }),
  setShowStats: (show) => set({ showStats: show }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  
  showNotification: (message, type = 'info') =>
    set({ 
      notification: { message, type, id: Date.now() }
    }),
  
  clearNotification: () => set({ notification: null })
}))
