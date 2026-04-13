# Plan2Render Architecture Overview

Complete technical architecture and data flow documentation.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT SIDE                             │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────────────────────────┐
│  │            React Frontend (Vite + Webpack)               │
│  ├──────────────────────────────────────────────────────────┤
│  │                                                           │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  │   Editor     │  │   Projects   │  │   Upload     │  │
│  │  │   Module     │  │   Dashboard  │  │   Manager    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │
│  │         ↓                                     ↓           │
│  │  ┌────────────────────────────────────────────────────┐ │
│  │  │      Three.js 3D Viewer + Controls                 │ │
│  │  │  (OrbitControls, TransformControls, GLTF Loader)   │ │
│  │  └────────────────────────────────────────────────────┘ │
│  │         ↓                                                │
│  │  ┌────────────────────────────────────────────────────┐ │
│  │  │        Zustand State Management                    │ │
│  │  │  (objects, selected, camera, layout, UI)           │ │
│  │  └────────────────────────────────────────────────────┘ │
│  │                      ↓                                   │
│  └───────────────────────┼──────────────────────────────────┘
│                          │
│            HTTP/REST Calls (JSON)
│                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                              │
├─────────────────────────────────────────────────────────────────┤
│
│  Port: 5000
│  Framework: Express.js with Node.js
│
│  ┌──────────────────────────────────────────────────────────┐
│  │                  Route Handlers                          │
│  ├──────────────────────────────────────────────────────────┤
│  │
│  │  /api/auth/register     ─→  Register & Login
│  │  /api/auth/login        ─→
│  │
│  │  /api/projects          ─→  CRUD Projects
│  │  /api/projects/:id      ─→
│  │
│  │  /api/upload            ─→  File Upload
│  │  /api/output/:id        ─→  Get Processed Files
│  │
│  │  /api/layout/:id        ─→  Save/Load Layouts
│  │                              Store Customizations
│  │
│  └──────────────────────────────────────────────────────────┘
│         ↓                              ↓                ↓
│    ┌─────────┐              ┌──────────────┐    ┌────────────┐
│    │ User    │              │  Projects &  │    │  Layouts & │
│    │ Auth    │              │   Files DB   │    │  Edits DB  │
│    └─────────┘              └──────────────┘    └────────────┘
│        ↓                          ↓                    ↓
└────────┼──────────────────────────┼────────────────────┼─────┘
         │                          │                    │
         │  PostgreSQL Driver (pg)  │                    │
         │                          │                    │
         ↓                          ↓                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                 PostgreSQL Database (Port 5432)                |
├─────────────────────────────────────────────────────────────────┤
│
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│  │   users     │  │  projects    │  │    files     │
│  │             │  │              │  │              │
│  │ id (UUID)   │  │ id (UUID)    │  │ id (UUID)    │
│  │ username    │  │ user_id (FK) │  │ project_..FK │
│  │ email       │  │ name         │  │ original_n.  │
│  │ password_.. │  │ description  │  │ file_path    │
│  │ full_name   │  │ status       │  │ file_type    │
│  │ created_at  │  │ created_at   │  │ file_size    │
│  │             │  │              │  │ uploaded_at  │
│  └─────────────┘  └──────────────┘  └──────────────┘
│
│  ┌──────────────┐  ┌──────────────┐
│  │    jobs      │  │    layouts   │
│  │              │  │              │
│  │ id (UUID)    │  │ id (UUID)    │
│  │ project_..FK │  │ project_..FK │
│  │ file_id (FK) │  │ layout_data  │
│  │ job_id       │  │ version      │
│  │ status       │  │ saved_by (FK)│
│  │ progress     │  │ saved_at     │
│  │ result (JSONB)  │ updated_at   │
│  │ error_msg    │  │              │
│  │ started_at   │  │              │
│  │ completed_at │  │              │
│  └──────────────┘  └──────────────┘
│
└─────────────────────────────────────────────────────────────────┘
         ↑
         │  Query/Update
         │
┌─────────┴───────────────────────────────────────────────────────┐
│                       ASYNC QUEUE SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│
│  Framework: BullMQ
│  Queue Name: dxf-processing
│
│  ┌──────────────────────────┐
│  │   Job Creation           │
│  │  (File uploaded)         │
│  │  → Job enters queue      │
│  │  → Status: "pending"     │
│  └──────┬───────────────────┘
│         │
│         ↓
│  ┌──────────────────────────┐
│  │   Redis Cache (Port 6379)│
│  │   Queue Storage          │
│  │                          │
│  │   Key:                  │
│  │   bull:dxf-processing:1 │
│  │   bull:dxf-processing:2 │
│  │   ...                    │
│  └──────┬───────────────────┘
│         │  Worker polls
│         │  jobs from queue
│         ↓
│  ┌──────────────────────────────────┐
│  │  Worker Process (Port: none)    │
│  │  Node.js Child Process           │
│  │  (Concurrency: 2)                │
│  └──────┬───────────────────────────┘
│         │ Implements: processDXF()
│         │ Spawns: Python subprocess
│         ↓
└─────────┼─────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON PROCESSING PIPELINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: DXF File                                                │
│                                                                 │
│  ┌──────────────────┐                                           │
│  │   dxf_parser.py  │  ← Parse DXF using ezdxf               │
│  │                  │     Extract: lines, polylines, blocks    │
│  │                  │     Output: Structured data JSON         │
│  └────────┬─────────┘                                           │
│           ↓                                                     │
│  ┌──────────────────┐                                           │
│  │  geometry.py     │  ← Detect geometry               │
│  │                  │     Identify: walls, doors, windows      │
│  │                  │     Calculate: room dimensions           │
│  │                  │     Output: Geometry objects             │
│  └────────┬─────────┘                                           │
│           ↓                                                     │
│  ┌──────────────────┐                                           │
│  │mesh_generator.py │  ← Generate 3D mesh using trimesh       │
│  │                  │     Create: wall frames, doors, windows  │
│  │                  │     Add: floor, ceiling                  │
│  │                  │     Output: Trimesh object               │
│  └────────┬─────────┘                                           │
│           ↓                                                     │
│  ┌──────────────────┐                                           │
│  │gltf_exporter.py  │  ← Export to GLTF/GLB format    │
│  │                  │     Optimize: merge primitives           │
│  │                  │     Output: Binary GLB file               │
│  └────────┬─────────┘                                           │
│           ↓                                                     │
│  Output: <project-id>.glb                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          │ Updates job status
          │ Stores result path
          ↓
      Back to Job
      Status: "completed"
      Updated in DB
```

---

## 🔄 Data Flow - Complete User Journey

```
1. USER REGISTRATION
   ┌────────┐
   │ Client │
   └─┬──────┘
     │ POST /auth/register
     │ {username, email, password}
     ↓
   ┌──────────┐
   │ Backend  │
   └─┬────────┘
     │ Hash password
     │ Create user record
     ↓
   ┌──────────────┐
   │ PostgreSQL   │ ← Save user
   └──────────────┘

2. LOGIN
   ┌────────┐
   │ Client │
   └─┬──────┘
     │ POST /auth/login
     ├─→ Backend checks password
     ↓
   ┌──────────┐
   │ Backend  │
   └─┬────────┘
     │ Generate JWT token
     ↓
   ┌────────┐
   │ Client │ ← Receives token, stores locally
   └────────┘

3. CREATE PROJECT
   ┌────────┐
   │ Client │
   └─┬──────┘
     │ POST /projects
     │ {name, description}
     │ + Authorization header
     ↓
   ┌──────────┐
   │ Backend  │
   └─┬────────┘
     │ Verify JWT
     │ Create project record
     ↓
   ┌──────────────┐
   │ PostgreSQL   │ ← Save project
   └──────────────┘

4. EDITOR: ADD FURNITURE
   ┌────────┐
   │ Client │
   └─┬──────┘
     │ Click "Add Sofa"
     ↓
   ┌───────────┐
   │ Zustand   │ ← Update state
   │ store     │   Add object to list
   ├───────────┤
   │ objects[] │
   │ [sofa]    │
   └─┬─────────┘
     │
     ↓
   ┌────────────┐
   │ Three.js   │ ← Render 3D mesh
   │ Scene      │   with transform controls
   └────────────┘

5. EDITOR: SAVE LAYOUT
   ┌────────┐
   │ Client │
   └─┬──────┘
     │ Click "Save"
     │ POST /layout/:projectId
     │ {objects[]}
     ↓
   ┌──────────┐
   │ Backend  │
   └─┬────────┘
     │ Verify access
     │ Save layout JSON
     ↓
   ┌──────────────┐
   │ PostgreSQL   │ ← Save in layouts table
   │ layouts      │   version incremented
   └──────────────┘

6. UPLOAD DXF
   ┌────────┐
   │ Client │
   └─┬──────┘
     │ POST /upload
     │ multipart: file + projectId
     ↓
   ┌──────────┐
   │ Backend  │
   └─┬────────┘
     │ Save file to disk
     │ Create job record
     │ Push to BullMQ
     ↓
   ┌─────────────┐
   │ PostgreSQL  │ ← Save file & job
   └─┬───────────┘
     │
     ↓
   ┌──────────┐
   │ Redis    │ ← Job queued
   │ BullMQ   │
   └─┬────────┘
     │
     ↓
   ┌──────────┐
   │ Worker   │ ← Picks up job
   └─┬────────┘
     │ Spawn Python process
     ↓
   ┌────────────────────┐
   │ Python Pipeline    │
   ├────────────────────┤
   │ 1. Parse DXF       │
   │ 2. Detect geometry │
   │ 3. Generate mesh   │
   │ 4. Export GLTF     │
   └─┬──────────────────┘
     │ Writes: <id>.glb
     ↓
   ┌──────────────────┐
   │ File System      │ ← Save outputs/
   └──────────────────┘
     │ Update job status
     │ Store result path
     ↓
   ┌─────────────┐
   │ PostgreSQL  │ ← Status: completed
   └─┬───────────┘
     │
     ↓
   ┌────────┐
   │ Client │ ← Poll /upload/job/:jobId
   │        │ → Get result when ready
   │        │ → Download .glb file
   └────────┘
```

---

## 📦 File Structure Detailed

```
Plan2Render/
│
├── frontend/
│   ├── src/
│   │   ├── editor/
│   │   │   ├── store.js          ← Zustand state (critical)
│   │   │   ├── utils.js          ← Helper functions
│   │   │   ├── Editor.jsx        ← Main layout
│   │   │   ├── Scene.jsx         ← Three.js canvas
│   │   │   ├── ControlsPanel.jsx ← Property editor
│   │   │   └── FurnitureLibrary.jsx ← Furniture panel
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── db.js         ← Connection pool
│   │   │   ├── schema.js     ← Table definitions
│   │   │   └── migrate.js    ← Run migrations
│   │   ├── middleware/
│   │   │   ├── auth.js       ← JWT verification
│   │   │   └── upload.js     ← Multer config
│   │   ├── routes/
│   │   │   ├── auth.js       ← /api/auth/*
│   │   │   ├── projects.js   ← /api/projects/*
│   │   │   ├── upload.js     ← /api/upload/*
│   │   │   └── layout.js     ← /api/layout/*
│   │   └── server.js         ← Main Express app
│   ├── package.json
│   └── Dockerfile
│
├── worker/
│   ├── src/
│   │   └── worker.js        ← BullMQ consumer
│   ├── package.json
│   └── Dockerfile
│
├── processing/
│   ├── main.py              ← Entry point
│   ├── dxf_parser.py        ← Parse DXF → JSON
│   ├── geometry.py          ← Detect walls/doors/windows
│   ├── mesh_generator.py    ← Create 3D mesh
│   ├── gltf_exporter.py     ← Export to GLB
│   ├── requirements.txt
│   └── __init__.py
│
├── database/
│   ├── migrations/
│   │   └── 001_initial.sql
│   └── seeds/
│       └── sample_data.sql
│
├── package.json             ← Monorepo root
├── .env.example
├── .gitignore
├── README.md
├── QUICKSTART.md
├── SETUP.md
├── API.md
├── ARCHITECTURE.md          ← This file
├── docker-compose.yml
└── .dockerignore
```

---

## 🔌 Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool (fast bundling)
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components (OrbitControls, TransformControls)
- **Zustand** - Lightweight state management

### Backend
- **Node.js 18** - Runtime
- **Express.js 4** - Web framework
- **PostgreSQL** - Primary database
- **node-postgres (pg)** - DB driver
- **BullMQ** - Job queue
- **Redis** - Cache & queue store
- **Multer** - File upload handling
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Processing
- **Python 3.9+** - DXF processing
- **ezdxf** - DXF file parsing
- **Shapely** - Geometric algorithms
- **trimesh** - 3D mesh operations
- **NumPy** - Numerical computing

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nodemon** - Dev auto-restart

---

## ⚡ Performance Considerations

### Frontend
- **Lazy load**furniture models: Load .glb on demand
- **Virtual scrolling** for large furniture lists
- **Memoization** with React.memo() for expensive renders
- **Web Workers** for heavy computations

### Backend
- **Connection pooling**: PostgreSQL max 20 connections
- **Query optimization**: Indexed user_id, project_id, project_id
- **Pagination**: Limit results in list endpoints
- **Caching**: Redis for frequently accessed layouts

### Processing
- **Parallel jobs**: Worker concurrency = 2
- **Time limits**: Job timeout after 30 minutes
- **Memory management**: Process large DXF serially
- **Streaming**: GLTF export as binary (smaller size)

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────┐
│         CLIENT (Browser)            │
└────────────────┬────────────────────┘
                 │
          HTTPS/TLS Encryption
                 ↓
        ┌────────────────────┐
        │  Backend Server    │
        ├────────────────────┤
        │ JWT Verification   │
        │ ✓ Token validity   │
        │ ✓ Signature check  │
        │ ✓ Expiration       │
        └────────┬───────────┘
                 │
         Access Control Check
                 │
        ┌────────────────────┐
        │  Route Handler     │
        ├────────────────────┤
        │ Validate ownership │
        │ Check user_id      │
        │ Sanitize inputs    │
        └────────┬───────────┘
                 │
        Parameterized Queries
        (SQL Injection safe)
                 │
        ┌────────────────────┐
        │   PostgreSQL DB    │
        ├────────────────────┤
        │ Encrypted passwords│
        │ bcryptjs hashing   │
        │ Row-level security │
        └────────────────────┘
```

---

## 🚀 Deployment Pipeline

```
┌──────────────┐
│ Source Code  │ ← git push
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│  GitHub Actions CI   │
├──────────────────────┤
│ 1. Run tests         │
│ 2. Lint code         │
│ 3. Build images      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────┐
│ Docker Registry  │ ← Push images
└──────┬───────────┘
       │
       ↓
┌──────────────────────────┐
│ Production Server        │
├──────────────────────────┤
│ 1. Pull images           │
│ 2. docker-compose up     │
│ 3. Run migrations        │
│ 4. Health checks         │
└──────────────────────────┘
```

---

## 📊 Infrastructure Requirements

### Minimum (Development)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB

### Recommended (Production)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB (SSD for speed)
- **Backup**: Automated daily PostgreSQL dumps
- **CDN**: For GLTF file distribution

---

**Last Updated:** 2024  
**Architecture Version:** 1.0.0
