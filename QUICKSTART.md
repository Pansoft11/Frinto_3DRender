# Plan2Render - Quick Start Guide ⚡

Get Plan2Render running in **5 minutes**!

## Prerequisites Check

```bash
# Node.js 18+
node --version

# Python 3.9+
python --version

# PostgreSQL 14+
psql --version

# Redis 7+
redis-cli --version
```

---

## 🚀 Express Setup (Windows/Mac/Linux)

### Step 1: Clone & Install
```bash
cd Plan2Render
npm run install-all
cp .env.example .env
```

### Step 2: Start Dependencies

**Open Terminal 1 - PostgreSQL (if not running via Docker)**
```bash
# macOS with Homebrew
brew services start postgresql

# Windows - ensure PostgreSQL service is running
# Or use Docker:
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres -d postgres:15
```

**Open Terminal 2 - Redis**
```bash
# macOS with Homebrew
brew services start redis

# Or use Docker:
docker run -p 6379:6379 -d redis:7
```

### Step 3: Initialize Database

```bash
cd backend
npm run migrate
```

Expected: ✅ Database initialized successfully

### Step 4: Start Services

**Terminal 3 - Frontend**
```bash
npm run start-frontend
# 👉 Open http://localhost:5173
```

**Terminal 4 - Backend**
```bash
npm run start-backend
# API running on http://localhost:5000
```

**Terminal 5 - Worker**
```bash
npm run start-worker
# Processing DXF files from queue
```

---

## ✅ Verification Checklist

- [ ] Frontend loads at http://localhost:5173
- [ ] API responds: `curl http://localhost:5000/health`
- [ ] Edit a project (objects are saved/loaded)
- [ ] Upload a DXF file (creates job)

---

## 🎯 First Time Usage

### 1. Create Account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo",
    "email": "demo@example.com",
    "password": "demo123",
    "fullName": "Demo User"
  }'
```

Response includes `token` - save it!

### 2. Create Project
```bash
TOKEN=<your_token>
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Living Room",
    "description": "Interior design project"
  }'
```

Save the `id` (UUID)!

### 3. Test Editor
- Open http://localhost:5173
- Add furniture from library (left panel)
- Move objects with transform gizmo
- Change properties (right panel)
- Click **Save** to persist

### 4. Upload DXF (Optional)
```bash
PROJECT_ID=<your_project_id>
TOKEN=<your_token>

curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@your_file.dxf" \
  -F "projectId=$PROJECT_ID"
```

Worker will process and convert to GLTF ✨

---

## 📂 Project Structure

```
Plan2Render/
├── frontend/          ← React + Three.js UI
│   └── src/editor/    ← Interactive editor module
├── backend/           ← Express API server
│   └── src/           ← Routes, controllers, DB
├── worker/            ← BullMQ job processor
├── processing/        ← Python DXF pipeline
└── database/          ← Migrations & schema
```

---

## 🔧 Common Issues

### "Cannot find module"
```bash
npm run install-all
cd processing && pip install -r requirements.txt
```

### "Port 5000 already in use"
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>

# Or use different port
PORT=5001 npm run start-backend
```

### "Database connection refused"
```bash
# Check PostgreSQL
psql -l

# Or start with Docker
docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
```

### "Redis connection refused"
```bash
# Start Redis
redis-server

# Or Docker
docker run -p 6379:6379 redis:7
```

---

## 🎮 Editor Shortcuts

- **Click to select** - Select furniture
- **Drag gizmo** - Move object
- **Right-click + drag** - Rotate camera
- **Scroll** - Zoom
- **Properties panel** - Edit transform, color
- **Double-click** - Duplicate
- **Delete key** - Remove selected

---

## 📊 Useful Commands

```bash
# View logs
docker logs plan2render-backend

# Check queue status
redis-cli
> KEYS "bull:dxf-processing:*"

# Reset database
cd backend && npm run migrate

# Test API
curl http://localhost:5000/health

# Monitor Python processing
tail -f processing.log
```

---

## 🚀 Next: Deploy

See [SETUP.md](./SETUP.md) for production deployment using Docker Compose.

---

## 💡 Pro Tips

✅ Auto-saves every 30 seconds  
✅ Export/Import layouts as JSON  
✅ Multiple projects per user  
✅ Real-time object synchronization  
✅ Snap-to-grid positioning  

---

**🎉 You're ready to go!**

Start adding furniture, customize layouts, and build amazing interior designs!

Questions? Check [SETUP.md](./SETUP.md) for detailed docs.
