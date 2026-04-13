# Plan2Render - SaaS DXF to 3D Interior Layout Converter

Convert 2D AutoCAD DXF files into interactive 3D interior layouts with a powerful GUI editor for furniture, lighting, and materials customization.

## 🏗️ Architecture

```
Plan2Render/
├── frontend/          # React + Vite + Three.js UI
├── backend/           # Express.js API server
├── worker/            # BullMQ job processor
├── processing/        # Python DXF processing
├── database/          # PostgreSQL migrations
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Install all dependencies
npm run install-all

# Setup environment variables
cp .env.example .env
```

### Running Locally

**Terminal 1 - Frontend:**
```bash
npm run start-frontend
```

**Terminal 2 - Backend:**
```bash
npm run start-backend
```

**Terminal 3 - Worker:**
```bash
npm run start-worker
```

Or all at once:
```bash
npm run start-all
```

## 📋 Project Structure

### Frontend (React + Vite)
- **src/editor/** - Interactive 3D editor with furniture library
- **src/pages/** - Dashboard, projects, editor
- **src/components/** - Reusable UI components
- **src/hooks/** - Custom React hooks

### Backend (Express.js)
- **routes/** - API endpoints
- **controllers/** - Business logic
- **middleware/** - Authentication, file upload
- **models/** - Database queries

### Worker (BullMQ)
- Processes DXF files asynchronously
- Calls Python processing pipeline
- Stores results in database

### Processing (Python)
- **dxf_parser.py** - Parse DXF using ezdxf
- **geometry.py** - Detect walls, doors, windows
- **mesh_generator.py** - Generate 3D meshes
- **gltf_exporter.py** - Export to GLTF

## 🎯 Key Features

✅ **Upload & Process** - Upload DXF, auto-generate 3D model
✅ **Interactive Editor** - Move, rotate, customize furniture
✅ **Material Editor** - Change colors, textures
✅ **Furniture Library** - Pre-built models (sofa, bed, lighting)
✅ **Save & Load** - Persist layouts in PostgreSQL
✅ **Real-time Collab** - WebSocket support ready

## 🔧 API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project

### Files
- `POST /api/upload` - Upload DXF file
- `GET /api/process/:jobId` - Check job status
- `GET /api/output/:projectId` - Get generated GLTF

### Layout
- `GET /api/layout/:projectId` - Load saved layout
- `POST /api/layout/:projectId` - Save layout customization

## 🗄️ Database Schema

See `database/migrations/` for full schema including:
- `users` - User accounts
- `projects` - CAD projects
- `files` - Uploaded DXF files
- `jobs` - Processing jobs
- `layouts` - Editor customizations

## 📦 Tech Stack

### Frontend
- React 18 + Vite
- Three.js + react-three-fiber + drei
- Zustand (state management)
- TailwindCSS (styling)

### Backend
- Express.js
- PostgreSQL + node-postgres
- JWT authentication
- Multer (file upload)

### Queue & Processing
- BullMQ
- Redis
- Python (ezdxf, shapely, trimesh)

## 🚦 Workflow

1. **Upload** → User uploads DXF file
2. **Queue** → Backend creates BullMQ job
3. **Process** → Worker processes DXF with Python
4. **Store** → Generated GLTF saved
5. **Load** → Frontend loads 3D model
6. **Edit** → User customizes with editor
7. **Save** → Layout JSON persisted

## 📝 Environment Variables

```env
# Frontend
VITE_API_URL=http://localhost:5000
VITE_APP_URL=http://localhost:5173

# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/plan2render
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
PORT=5000

# Processing
PYTHON_PATH=/usr/bin/python3
OUTPUT_DIR=./uploads/output
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Python tests
cd processing && pytest
```

## 🚀 Deployment

### Docker Compose (All Services)
```bash
docker-compose up -d
```

### Individual Services
```bash
# Frontend
npm run build
npm run preview

# Backend
npm run build
npm start

# Worker
npm start
```

## 📈 Performance Optimization

- **Lazy load** furniture models
- **WebWorkers** for mesh processing
- **Caching** of GLTF files
- **Compression** of JSON layouts
- **CDN** for static assets

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/amazing`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing`)
4. Open Pull Request

## 📄 License

MIT

---

**Built with ❤️ by engineering team**
