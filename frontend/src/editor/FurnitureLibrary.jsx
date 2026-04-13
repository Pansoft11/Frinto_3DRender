import { useState } from 'react'
import { useEditorStore } from './store'
import { FURNITURE_CATALOG, groupByCategory, generateId } from './utils'

/**
 * Furniture library panel - add furniture and objects
 */
export default function FurnitureLibrary() {
  const { addObject } = useEditorStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({
    seating: true,
    lighting: true
  })

  const addFurniture = (type) => {
    const furnitureSpec = FURNITURE_CATALOG[type]
    if (!furnitureSpec) return

    addObject({
      id: generateId(),
      type,
      label: furnitureSpec.label,
      position: [
        Math.random() * 2 - 1,
        0,
        Math.random() * 2 - 1
      ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: furnitureSpec.color,
      category: furnitureSpec.category,
      dimensions: furnitureSpec.dimensions
    })
  }

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // Group furniture and filter
  const categorized = groupByCategory(
    Object.entries(FURNITURE_CATALOG).map(([type, spec]) => ({
      ...spec,
      type
    }))
  )

  // Filter by search term
  const filtered = Object.entries(categorized).reduce((acc, [category, items]) => {
    const filteredItems = items.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filteredItems.length > 0) {
      acc[category] = filteredItems
    }
    return acc
  }, {})

  return (
    <div className="panel">
      <h3>🛋️ Furniture Library</h3>

      {/* Search */}
      <div className="panel-section">
        <input
          type="text"
          placeholder="Search furniture..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#e2e8f0',
            borderRadius: '6px',
            fontSize: '13px'
          }}
        />
      </div>

      {/* Furniture catalog by category */}
      <div style={{ marginTop: 12 }}>
        {Object.entries(filtered).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 12 }}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#334155',
                border: 'none',
                borderRadius: '6px',
                color: '#e2e8f0',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'background 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => (e.target.style.background = '#475569')}
              onMouseLeave={(e) => (e.target.style.background = '#334155')}
            >
              {category}
              <span>{expandedCategories[category] ? '▼' : '▶'}</span>
            </button>

            {/* Items */}
            {expandedCategories[category] && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addFurniture(item.type)}
                    style={{
                      padding: '10px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#334155'
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.transform = 'translateX(2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#1e293b'
                      e.target.style.borderColor = '#334155'
                      e.target.style.transform = 'translateX(0)'
                    }}
                  >
                    {/* Color preview */}
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background: item.color,
                        border: '1px solid #475569'
                      }}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filtered).length === 0 && (
          <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: 20 }}>
            No results found
          </div>
        )}
      </div>

      {/* Quick add buttons */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #334155' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
          QUICK ADD
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            onClick={() => addFurniture('sofa')}
            style={{
              padding: '6px',
              fontSize: '11px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Sofa
          </button>
          <button
            onClick={() => addFurniture('bed')}
            style={{
              padding: '6px',
              fontSize: '11px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Bed
          </button>
          <button
            onClick={() => addFurniture('table')}
            style={{
              padding: '6px',
              fontSize: '11px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Table
          </button>
          <button
            onClick={() => addFurniture('lamp')}
            style={{
              padding: '6px',
              fontSize: '11px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Lamp
          </button>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          marginTop: 16,
          padding: '8px 10px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#7dd3fc',
          lineHeight: 1.4
        }}
      >
        <strong>💡 Tip:</strong> Click any furniture to add it to the scene. Use
        the transform gizmo to move objects.
      </div>
    </div>
  )
}
