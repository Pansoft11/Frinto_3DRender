import { useEditorStore } from './store'
import { snapToGrid } from './utils'

/**
 * Type-specific control components
 */

function SofaControls({ object }) {
  const { updateObject } = useEditorStore()

  return (
    <div className="panel-section" style={{ background: 'rgba(139, 69, 19, 0.1)', padding: 8, borderRadius: 6 }}>
      <label style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 8, display: 'block', fontSize: 12 }}>
        🛋️ Sofa Controls
      </label>

      {/* Color control */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: '#94a3b8' }}>Color</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input
            type="color"
            value={object.color}
            onChange={(e) => updateObject(object.id, { color: e.target.value })}
            style={{ flex: 1, height: 30, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 11, color: '#7dd3fc', display: 'flex', alignItems: 'center' }}>
            {object.color}
          </span>
        </div>
      </div>

      {/* Scale control - uniform */}
      <div>
        <label style={{ fontSize: 11, color: '#94a3b8' }}>Scale (Uniform)</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={object.scale[0]}
          onChange={(e) => {
            const s = parseFloat(e.target.value)
            updateObject(object.id, { scale: [s, s, s] })
          }}
          style={{ width: '100%', marginTop: 4 }}
        />
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
          {object.scale[0].toFixed(2)}x
        </div>
      </div>
    </div>
  )
}

function LampControls({ object }) {
  const { updateObject } = useEditorStore()

  const intensity = object.properties?.intensity || 1

  return (
    <div className="panel-section" style={{ background: 'rgba(255, 215, 0, 0.1)', padding: 8, borderRadius: 6 }}>
      <label style={{ fontWeight: 600, color: '#fbbf24', marginBottom: 8, display: 'block', fontSize: 12 }}>
        💡 Lamp Controls
      </label>

      {/* Intensity control */}
      <div>
        <label style={{ fontSize: 11, color: '#94a3b8' }}>Intensity</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={intensity}
          onChange={(e) => {
            const newIntensity = parseFloat(e.target.value)
            updateObject(object.id, {
              properties: { ...object.properties, intensity: newIntensity },
              color: `hsl(45, 100%, ${50 + newIntensity * 10}%)`
            })
          }}
          style={{ width: '100%', marginTop: 4 }}
        />
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
          {intensity.toFixed(1)} brightness
        </div>
      </div>
    </div>
  )
}

function WallControls({ object }) {
  const { updateObject } = useEditorStore()

  const material = object.properties?.material || 'concrete'

  const materials = {
    concrete: { label: 'Concrete', color: '#808080' },
    brick: { label: 'Brick', color: '#C85A54' },
    drywall: { label: 'Drywall', color: '#D3D3D3' },
    wood: { label: 'Wood', color: '#8B4513' }
  }

  return (
    <div className="panel-section" style={{ background: 'rgba(128, 90, 213, 0.1)', padding: 8, borderRadius: 6 }}>
      <label style={{ fontWeight: 600, color: '#d8b4fe', marginBottom: 8, display: 'block', fontSize: 12 }}>
        🧱 Wall Controls
      </label>

      {/* Material selector */}
      <div>
        <label style={{ fontSize: 11, color: '#94a3b8' }}>Material</label>
        <select
          value={material}
          onChange={(e) => {
            const mat = e.target.value
            const color = materials[mat]?.color || '#808080'
            updateObject(object.id, {
              properties: { ...object.properties, material: mat },
              color: color
            })
          }}
          style={{
            width: '100%',
            marginTop: 4,
            padding: '6px 8px',
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          {Object.entries(materials).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      {/* Material preview */}
      <div
        style={{
          marginTop: 8,
          width: '100%',
          height: 30,
          backgroundColor: materials[material]?.color,
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      />
    </div>
  )
}

/**
 * Main property editor panel
 */
export default function ControlsPanel({ object }) {
  const { updateObject, deleteObject, selected, canUndo, canRedo, undo, redo } =
    useEditorStore()

  if (!object || !selected) {
    return (
      <div className="panel no-selection">
        <p>👈 Select an object to edit</p>
      </div>
    )
  }

  const handlePositionChange = (axis, value) => {
    const newPos = [...object.position]
    newPos[axis] = parseFloat(value)
    if (axis === 1) newPos[axis] = Math.max(0, newPos[axis]) // Clamp Y to ground
    updateObject(object.id, { position: newPos })
  }

  const handleRotationChange = (axis, value) => {
    const newRot = [...object.rotation]
    newRot[axis] = parseFloat(value)
    updateObject(object.id, { rotation: newRot })
  }

  const handleScaleChange = (axis, value) => {
    const scale = parseFloat(value)
    const newScale = [...object.scale]
    newScale[axis] = Math.max(0.1, scale)
    updateObject(object.id, { scale: newScale })
  }

  const handleColorChange = (e) => {
    updateObject(object.id, { color: e.target.value })
  }

  const handleSnap = () => {
    const snappedPos = object.position.map((p, i) =>
      i === 1 ? Math.max(0, snapToGrid(p)) : snapToGrid(p)
    )
    updateObject(object.id, { position: snappedPos })
  }

  const handleDelete = () => {
    if (confirm(`Delete ${object.type}?`)) {
      deleteObject(object.id)
    }
  }

  const handleDuplicate = () => {
    const { addObject } = useEditorStore.getState()
    addObject({
      ...object,
      id: undefined,
      position: [
        object.position[0] + 0.5,
        object.position[1],
        object.position[2] + 0.5
      ]
    })
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>📋 Properties</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={undo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
            style={{
              padding: '4px 8px',
              fontSize: 11,
              background: canUndo() ? '#3b82f6' : '#1e293b',
              color: canUndo() ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: 4,
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
              padding: '4px 8px',
              fontSize: 11,
              background: canRedo() ? '#3b82f6' : '#1e293b',
              color: canRedo() ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: 4,
              cursor: canRedo() ? 'pointer' : 'not-allowed',
              opacity: canRedo() ? 1 : 0.5
            }}
          >
            ↷
          </button>
        </div>
      </div>

      {/* Object info */}
      <div className="panel-section">
        <label>Type</label>
        <input type="text" value={object.type} readOnly style={{ opacity: 0.7 }} />
      </div>

      {/* Type-specific controls */}
      {object.type === 'sofa' && <SofaControls object={object} />}
      {object.type === 'lamp' && <LampControls object={object} />}
      {object.type === 'wall' && <WallControls object={object} />}

      {/* Position */}
      <div className="panel-section">
        <label>Position (X, Y, Z)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          <input
            type="number"
            step="0.1"
            value={object.position[0].toFixed(2)}
            onChange={(e) => handlePositionChange(0, e.target.value)}
            placeholder="X"
          />
          <input
            type="number"
            step="0.1"
            min="0"
            value={object.position[1].toFixed(2)}
            onChange={(e) => handlePositionChange(1, e.target.value)}
            placeholder="Y (Ground)"
          />
          <input
            type="number"
            step="0.1"
            value={object.position[2].toFixed(2)}
            onChange={(e) => handlePositionChange(2, e.target.value)}
            placeholder="Z"
          />
        </div>
        <button
          onClick={handleSnap}
          style={{
            marginTop: 4,
            fontSize: '11px',
            padding: '4px 8px',
            width: '100%',
            background: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.background = '#475569')}
          onMouseLeave={(e) => (e.target.style.background = '#334155')}
        >
          🎯 Snap to Grid
        </button>
      </div>

      {/* Rotation */}
      <div className="panel-section">
        <label>Rotation (Radians)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          <input
            type="number"
            step="0.05"
            value={object.rotation[0].toFixed(2)}
            onChange={(e) => handleRotationChange(0, e.target.value)}
            placeholder="X"
          />
          <input
            type="number"
            step="0.05"
            value={object.rotation[1].toFixed(2)}
            onChange={(e) => handleRotationChange(1, e.target.value)}
            placeholder="Y"
          />
          <input
            type="number"
            step="0.05"
            value={object.rotation[2].toFixed(2)}
            onChange={(e) => handleRotationChange(2, e.target.value)}
            placeholder="Z"
          />
        </div>
      </div>

      {/* Scale */}
      <div className="panel-section">
        <label>Scale (X, Y, Z)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[0].toFixed(2)}
            onChange={(e) => handleScaleChange(0, e.target.value)}
            placeholder="X"
          />
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[1].toFixed(2)}
            onChange={(e) => handleScaleChange(1, e.target.value)}
            placeholder="Y"
          />
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={object.scale[2].toFixed(2)}
            onChange={(e) => handleScaleChange(2, e.target.value)}
            placeholder="Z"
          />
        </div>
      </div>

      {/* Color */}
      <div className="panel-section">
        <label>Color</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="color"
            value={object.color}
            onChange={handleColorChange}
            style={{ flex: 1, cursor: 'pointer' }}
          />
          <span
            style={{
              fontSize: '12px',
              color: '#7dd3fc',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {object.color}
          </span>
        </div>
      </div>

      {/* Info display */}
      <div
        className="panel-section"
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '8px',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#7dd3fc'
        }}
      >
        <strong>📍 Position:</strong> [{object.position.map((p) => p.toFixed(1)).join(', ')}]
        <br />
        <strong>🔄 Rotation:</strong> [{object.rotation.map((r) => r.toFixed(2)).join(', ')}]
        <br />
        <strong>📏 Scale:</strong> [{object.scale.map((s) => s.toFixed(2)).join(', ')}]
      </div>

      {/* Actions */}
      <div className="panel-buttons">
        <button
          onClick={handleDuplicate}
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.background = '#2563eb')}
          onMouseLeave={(e) => (e.target.style.background = '#3b82f6')}
        >
          📋 Duplicate
        </button>
        <button
          onClick={handleDelete}
          style={{
            background: '#ef4444',
            color: 'white',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 500,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            gridColumn: '1 / -1',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.target.style.background = '#dc2626')}
          onMouseLeave={(e) => (e.target.style.background = '#ef4444')}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}
