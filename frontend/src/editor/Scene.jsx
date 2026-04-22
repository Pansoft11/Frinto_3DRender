import { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  TransformControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Environment,
  PerspectiveCamera
} from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore } from './store'
import { getModelMaterial, getModelScale, getFallbackGeometry } from './models'

/**
 * Geometry factory for fallback models
 */
function GeometryFactory({ type, scale, color }) {
  const def = { box: [1, 1, 1], cylinder: [0.5, 1, 8], cone: [0.5, 1, 8] }
  const fallbackType = getFallbackGeometry(type)
  const dims = def[fallbackType] || def.box

  const material = getModelMaterial(type, color)

  switch (fallbackType) {
    case 'cylinder':
      return (
        <mesh>
          <cylinderGeometry args={dims} />
          <meshStandardMaterial {...material} />
        </mesh>
      )
    case 'cone':
      return (
        <mesh>
          <coneGeometry args={dims} />
          <meshStandardMaterial {...material} />
        </mesh>
      )
    default:
      return (
        <mesh>
          <boxGeometry args={dims} />
          <meshStandardMaterial {...material} />
        </mesh>
      )
  }
}

/**
 * Editable 3D object with transform controls
 */
function EditableObject({ obj, isSelected, onSelect, transformRef, transformMode }) {
  const objectRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [, setTransformTargetReady] = useState(0)

  // Keep the Three.js object synchronized with Zustand state.
  useEffect(() => {
    if (objectRef.current) {
      objectRef.current.position.set(...obj.position)
      objectRef.current.rotation.set(...obj.rotation)
      objectRef.current.scale.set(...obj.scale)
    }
  }, [obj])

  useEffect(() => {
    setTransformTargetReady((value) => value + 1)
  }, [])

  const material = getModelMaterial(obj.type, obj.color)
  const fallbackType = getFallbackGeometry(obj.type)

  const objectMesh = (
    <group ref={objectRef} position={obj.position} rotation={obj.rotation} scale={obj.scale}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(obj)
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        {fallbackType === 'cylinder' && (
          <>
            <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
            <meshStandardMaterial
              {...material}
              emissive={isSelected ? '#4f46e5' : hovered ? '#6b7280' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : hovered ? 0.15 : 0}
            />
          </>
        )}
        {fallbackType === 'cone' && (
          <>
            <coneGeometry args={[0.5, 1, 8]} />
            <meshStandardMaterial
              {...material}
              emissive={isSelected ? '#4f46e5' : hovered ? '#6b7280' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : hovered ? 0.15 : 0}
            />
          </>
        )}
        {fallbackType === 'box' && (
          <>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              {...material}
              emissive={isSelected ? '#4f46e5' : hovered ? '#6b7280' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : hovered ? 0.15 : 0}
            />
          </>
        )}
      </mesh>

      {/* Selection highlight keeps object picking clear without changing geometry. */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            attach="geometry"
            args={[
              fallbackType === 'cylinder'
                ? new THREE.CylinderGeometry(0.51, 0.51, 1.02, 8)
                : fallbackType === 'cone'
                ? new THREE.ConeGeometry(0.51, 1.02, 8)
                : new THREE.BoxGeometry(1.02, 1.02, 1.02)
            ]}
          />
          <lineBasicMaterial
            attach="material"
            color="#4f46e5"
            linewidth={3}
            transparent
            opacity={0.8}
          />
        </lineSegments>
      )}
    </group>
  )

  return (
    <>
      {objectMesh}
      {isSelected && objectRef.current && (
        <TransformControls
          ref={transformRef}
          object={objectRef.current}
          mode={transformMode}
          showX
          showY={transformMode !== 'translate'}
          showZ
          onObjectChange={() => {
            if (objectRef.current) {
              const { x, y, z } = objectRef.current.position
              const { x: rx, y: ry, z: rz } = objectRef.current.rotation
              const { x: sx, y: sy, z: sz } = objectRef.current.scale

              useEditorStore.getState().updateObject(obj.id, {
                position: [x, Math.max(0, y), z],
                rotation: [rx, ry, rz],
                scale: [sx, sy, sz]
              })
            }
          }}
        />
      )}
    </>
  )
}

/**
 * Professional lighting setup
 */
function Lighting() {
  const lightRef = useRef()

  useFrame(() => {
    if (lightRef.current) {
      // Subtle light animation
      lightRef.current.position.y = 20 + Math.sin(Date.now() * 0.0005) * 2
    }
  })

  return (
    <>
      {/* Ambient light - overall illumination */}
      <ambientLight intensity={0.5} color="#ffffff" />

      {/* Main directional light - primary shadow caster */}
      <directionalLight
        ref={lightRef}
        position={[15, 20, 15]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Fill light - soften shadows */}
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.4}
        color="#87ceeb"
      />

      {/* Back/rim light - scene definition */}
      <pointLight position={[-20, 10, 20]} intensity={0.3} color="#87ceeb" />

      {/* Hemisphere light - natural sky-like lighting */}
      <hemisphereLight
        skyColor="#87ceeb"
        groundColor="#8b8b8b"
        intensity={0.6}
      />
    </>
  )
}

/**
 * Enhanced floor grid with reference markers
 */
function FloorGrid() {
  return (
    <>
      {/* Main grid */}
      <Grid
        args={[100, 100]}
        cellSize={0.5}
        cellColor="#4b5563"
        sectionSize={5}
        sectionColor="#1f2937"
        fadeFrom={50}
        fadeTo={100}
        fadeStrength={1}
        infiniteGrid
        position={[0, 0, 0]}
      />

      {/* Axis lines at origin */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={6}
            array={new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#888888" linewidth={1} />
      </lineSegments>
    </>
  )
}

/**
 * Base model mesh rendering
 */
function BaseModel({ gltf }) {
  if (!gltf) return null
  return (
    <primitive
      object={gltf.scene}
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
      castShadow
      receiveShadow
    />
  )
}

/**
 * Main 3D Scene with enhanced features
 */
export default function Scene() {
  const {
    objects,
    selected,
    setSelected,
    updateObject,
    baseModel,
    camera,
    transformMode
  } = useEditorStore()

  const canvasRef = useRef()
  const transformRef = useRef()
  const orbitRef = useRef()

  const handleSelectObject = (obj) => {
    setSelected(obj)
  }

  const handleEmptyClick = (event) => {
    // Only deselect if clicking directly on canvas/grid
    if (event.target === event.currentTarget || event.object?.name === 'grid') {
      setSelected(null)
    }
  }

  // Keyboard shortcuts for transform modes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'g') useEditorStore.getState().setTransformMode('translate')
      if (e.key === 'r') useEditorStore.getState().setTransformMode('rotate')
      if (e.key === 's') useEditorStore.getState().setTransformMode('scale')
      if (e.key === 'z' && e.ctrlKey) {
        e.preventDefault()
        if (e.shiftKey) {
          useEditorStore.getState().redo()
        } else {
          useEditorStore.getState().undo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        background: '#0f172a',
        overflow: 'hidden'
      }}
    >
      <Canvas
        ref={canvasRef}
        camera={{
          position: camera.position,
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows="variance"
        onClick={handleEmptyClick}
      >
        {/* Lighting */}
        <Lighting />

        {/* Grid and reference */}
        <FloorGrid />

        {/* Base model (room/floor plan) */}
        {baseModel && <BaseModel gltf={baseModel} />}

        {/* Editable objects */}
        {objects.map((obj) => (
          <EditableObject
            key={obj.id}
            obj={obj}
            isSelected={selected?.id === obj.id}
            onSelect={handleSelectObject}
            transformRef={selected?.id === obj.id ? transformRef : null}
            transformMode={transformMode}
          />
        ))}

        {/* Orbit controls - main navigation */}
        <OrbitControls
          ref={orbitRef}
          makeDefault
          minDistance={2}
          maxDistance={100}
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          autoRotate={false}
          zoomSpeed={1.2}
        />

        {/* Gizmo helper - corner orientation */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisHeadScale={1.1} />
        </GizmoHelper>
      </Canvas>

      {/* Scene debug info overlay */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(15, 23, 42, 0.8)',
          color: '#10b981',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div>📊 Objects: {objects.length}</div>
        <div>🎯 Selected: {selected?.type || 'none'}</div>
        <div>📷 Pos: {camera.position.map((p) => p.toFixed(1)).join(', ')}</div>
        <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.7 }}>
          <div>G=Move R=Rotate S=Scale</div>
          <div>Ctrl+Z=Undo Ctrl+Shift+Z=Redo</div>
        </div>
      </div>

      {/* Transform mode indicator */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(79, 70, 229, 0.8)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          textTransform: 'uppercase',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}
      >
        Mode: {transformMode}
      </div>
    </div>
  )
}

