import { useState, useEffect } from 'react'
import { useEditorStore, useProjectStore } from './store'
import { exportSceneJSON, importSceneJSON } from './utils'
import { apiFetch } from '../api'
import Scene from './Scene'
import FurnitureLibrary from './FurnitureLibrary'
import ControlsPanel from './ControlsPanel'
import './Editor.css'

/**
 * Main Editor Layout with enhanced UX
 */
export default function Editor() {
  const {
    objects,
    selected,
    setObjects,
    reset,
    transformMode,
    setTransformMode,
    toggleSnap,
    snapEnabled,
    snapGrid,
    undo,
    redo,
    canUndo,
    canRedo
  } = useEditorStore()

  const { projectId, projectName, setSaving } = useProjectStore()
  const [message, setMessage] = useState('')

  // Auto-save layout
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (projectId && objects.length > 0) {
        saveLayout()
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [projectId, objects])

  // Load layout on component mount
  useEffect(() => {
    if (projectId) {
      loadLayout()
    }
  }, [projectId])

  const saveLayout = async () => {
    if (!projectId) {
      setMessage('No project selected')
      return
    }

    try {
      setSaving(true)
      const payload = exportSceneJSON(objects, null)

      const response = await apiFetch('/save-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, layout: payload })
      })

      if (response.ok) {
        setMessage('✓ Layout saved')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('Save failed:', err)
      setMessage('✗ Save failed')
    } finally {
      setSaving(false)
    }
  }

  const loadLayout = async () => {
    try {
      const response = await apiFetch(`/layout/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        const loadedObjects = importSceneJSON(data)
        setObjects(loadedObjects)
        setMessage('✓ Layout loaded')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('Load failed:', err)
      setMessage('✗ Load failed')
    }
  }

  const loadSuggestedLayout = async () => {
    try {
      const response = await apiFetch(`/api/layout/${projectId}/suggested`)
      if (!response.ok) {
        throw new Error('Failed to fetch suggested layout')
      }
      const result = await response.json()
      const loadedObjects = importSceneJSON({ objects: result.suggestedLayout })
      setObjects(loadedObjects)
      setMessage('✓ Suggested layout applied')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Suggested load failed:', err)
      setMessage('✗ Suggested layout failed')
    }
  }

  const exportJSON = () => {
    const json = exportSceneJSON(objects, null)
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `layout-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('✓ Exported JSON')
    setTimeout(() => setMessage(''), 3000)
  }

  const importJSON = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        const loadedObjects = importSceneJSON(json)
        setObjects(loadedObjects)
        setMessage('✓ Imported layout')
        setTimeout(() => setMessage(''), 3000)
      } catch (err) {
        console.error('Import failed:', err)
        setMessage('✗ Import failed')
      }
    }
    reader.readAsText(file)
  }

  const clearScene = () => {
    if (confirm('Clear all objects?')) {
      reset()
      setMessage('✓ Scene cleared')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const TransformModeButton = ({ mode, label, icon }) => (
    <button
      onClick={() => setTransformMode(mode)}
      title={`${label} (Press ${mode[0].toUpperCase()})`}
      style={{
        background: transformMode === mode ? '#4f46e5' : '#334155',
        color: '#e2e8f0',
        padding: '6px 10px',
        fontSize: '11px',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontWeight: transformMode === mode ? 600 : 500,
        transition: 'all 0.2s',
        boxShadow: transformMode === mode ? '0 0 10px rgba(79, 70, 229, 0.3)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (transformMode !== mode) {
          e.target.style.background = '#475569'
        }
      }}
      onMouseLeave={(e) => {
        if (transformMode !== mode) {
          e.target.style.background = '#334155'
        }
      }}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="editor-container">
      {/* Header */}
      <header className="editor-header">
        <div className="header-left">
          <h1 className="app-title">Plan2Render</h1>
          <span className="project-name">{projectName}</span>
        </div>

        <div className="header-actions">
          {/* Transform Controls */}
          <div style={{ display: 'flex', gap: 4, borderRight: '1px solid #475569', paddingRight: 12 }}>
            <TransformModeButton mode="translate" label="Move" icon="↔️" />
            <TransformModeButton mode="rotate" label="Rotate" icon="🔄" />
            <TransformModeButton mode="scale" label="Scale" icon="📏" />
          </div>

          {/* Snap Controls */}
          <button
            onClick={toggleSnap}
            title={`Toggle grid snap (${snapGrid}m)`}
            style={{
              background: snapEnabled ? '#10b981' : '#475569',
              color: '#e2e8f0',
              padding: '6px 10px',
              fontSize: '11px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            🎯 {snapEnabled ? 'Snap ON' : 'Snap OFF'}
          </button>

          {/* Undo/Redo */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={undo}
              disabled={!canUndo()}
              title="Undo (Ctrl+Z)"
              style={{
                background: canUndo() ? '#3b82f6' : '#1e293b',
                color: canUndo() ? '#e2e8f0' : '#64748b',
                padding: '6px 8px',
                fontSize: '11px',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                cursor: canUndo() ? 'pointer' : 'not-allowed',
                opacity: canUndo() ? 1 : 0.5
              }}
            >
              ↶
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              title="Redo (Ctrl+Shift+Z)"
              style={{
                background: canRedo() ? '#3b82f6' : '#1e293b',
                color: canRedo() ? '#e2e8f0' : '#64748b',
                padding: '6px 8px',
                fontSize: '11px',
                border: 'none',
                borderRadius: '0 4px 4px 0',
                cursor: canRedo() ? 'pointer' : 'not-allowed',
                opacity: canRedo() ? 1 : 0.5
              }}
            >
              ↷
            </button>
          </div>

          {/* File operations */}
          <button
            className="btn btn-primary"
            onClick={saveLayout}
            title="Save layout to database"
          >
            💾 Save
          </button>
          <button
            className="btn btn-secondary"
            onClick={loadLayout}
            title="Load latest saved layout"
          >
            📂 Load
          </button>
          <button
            className="btn btn-secondary"
            onClick={loadSuggestedLayout}
            title="Load AI-suggested furniture layout"
          >
            🤖 Suggest
          </button>
          <button
            className="btn btn-secondary"
            onClick={exportJSON}
            title="Download layout as JSON"
          >
            📥 Export
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📤 Import
            <input
              type="file"
              accept=".json"
              onChange={importJSON}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="btn btn-danger"
            onClick={clearScene}
            title="Clear all objects"
          >
            🗑️ Clear
          </button>
        </div>

        {message && <div className="header-message">{message}</div>}
      </header>

      {/* Main layout */}
      <div className="editor-main">
        {/* Left panel - Furniture library */}
        <aside className="editor-sidebar-left">
          <FurnitureLibrary />
        </aside>

        {/* Center - 3D Scene */}
        <div className="editor-canvas">
          <Scene />
        </div>

        {/* Right panel - Properties */}
        <aside className="editor-sidebar-right">
          {selected ? (
            <ControlsPanel object={selected} />
          ) : (
            <div className="panel no-selection">
              <p>👈 Select an object to edit properties</p>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                Or add from the furniture library
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
