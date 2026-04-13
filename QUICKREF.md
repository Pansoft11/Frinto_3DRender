# ⚡ Plan2Render - Developer Quick Reference

**Print this page for your desk!**

---

## 🚀 Start All Services (Copy-Paste)

```bash
# Terminal 1: Frontend
npm run start-frontend

# Terminal 2: Backend
npm run start-backend

# Terminal 3: Worker
npm run start-worker
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API Docs: http://localhost:5000/health

---

## 📦 Installation

```bash
# One-time setup
npm run install-all
cd backend && npm run migrate && cd ..

# Python dependencies
cd processing && pip install -r requirements.txt && cd ..
```

---

## 🔑 Core Files Quick Reference

| File | Purpose | Key Code |
|------|---------|----------|
| `frontend/src/editor/store.js` | Global state | `useEditorStore((set) => ({...}))` |
| `frontend/src/editor/Scene.jsx` | 3D viewer | `<Canvas>` + Three.js |
| `backend/src/server.js` | Express app | `app.post('/api/...')` |
| `backend/src/db/schema.js` | DB tables | `CREATE TABLE ...` |
| `worker/src/worker.js` | Job processor | `processDXF(job)` |
| `processing/main.py` | DXF pipeline | `process_dxf()` |

---

## 📡 Important API Endpoints

```bash
# Auth
POST   /api/auth/register          # Create account
POST   /api/auth/login             # Get token

# Projects
GET    /api/projects               # List all
POST   /api/projects               # Create one
GET    /api/projects/:id           # Get details
PUT    /api/projects/:id           # Update
DELETE /api/projects/:id           # Delete

# Files
POST   /api/upload                 # Upload DXF
GET    /api/upload/job/:jobId      # Check status
GET    /api/output/:projectId      # Get GLTF

# Layouts
GET    /api/layout/:projectId      # Load layout
POST   /api/layout/:projectId      # Save layout
GET    /api/layout/:projectId/history  # Version history
DELETE /api/layout/:projectId      # Delete layout

# Health
GET    /health                     # Server status
```

---

## 🧘 Editor Shortcuts

| Action | Key/Method |
|--------|-----------|
| Select object | Click on it |
| Deselect | Click empty space |
| Move object | Drag transform gizmo |
| Zoom camera | Scroll wheel |
| Rotate camera | Right-click + drag |
| Pan camera | Middle-click + drag |
| Add furniture | Click button in left panel |
| Edit properties | Right panel controls |
| Save layout | Click Save button |
| Duplicate | Select + Duplicate button |
| Delete | Select + Delete button |
| Snap to grid | Click "Snap to Grid" |

---

## 🧪 Testing Commands

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@email.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass123"}'

# Health check
curl http://localhost:5000/health

# Get projects (need TOKEN from login)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer TOKEN"

# Upload file
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@drawing.dxf" \
  -F "projectId=PROJECT_ID"
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# View running containers
docker ps

# Access container shell
docker exec -it plan2render-backend bash
```

---

## 🗄️ Database Commands

```bash
# Connect to database
psql -U postgres -d plan2render

# Basic queries
SELECT * FROM users;
SELECT COUNT(*) FROM projects;
SELECT * FROM jobs WHERE status = 'pending';

# Check schema
\d users
\d projects

# Exit
\q
```

---

## ⚙️ Environment Variables

```env
# Frontend (.env)
VITE_API_URL=http://localhost:5000

# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plan2render
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
PORT=5000

# Worker (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plan2render
REDIS_URL=redis://localhost:6379
```

---

## 🧠 State Management Quick Guide

```javascript
// Import store
import { useEditorStore } from './store'

// Get state
const { objects, selected } = useEditorStore()

// Add object
const { addObject } = useEditorStore()
addObject({
  id: 'obj-1',
  type: 'sofa',
  position: [0, 0, 0],
  color: '#8B4513'
})

// Update object
const { updateObject } = useEditorStore()
updateObject(id, { position: [1, 0, 0] })

// Select object
const { setSelected } = useEditorStore()
setSelected(object)
```

---

## 🎨 Key Component Props

### Editor.jsx
```jsx
<Editor />
// No props needed - uses stores internally
```

### Scene.jsx
```jsx
<Scene />
// No props needed - reads from stores
```

### ControlsPanel.jsx
```jsx
<ControlsPanel object={selected} />
// Props: object (selected furniture)
```

### FurnitureLibrary.jsx
```jsx
<FurnitureLibrary />
// No props needed - uses store actions
```

---

## 🔍 Debug Tips

```javascript
// Log store state
const store = useEditorStore.getState()
console.log('Objects:', store.objects)
console.log('Selected:', store.selected)

// Monitor state changes
useEditorStore.subscribe(
  state => console.log('State changed:', state)
)

// Check Three.js scene
console.log(scene) // In Scene.jsx

// Check transform controls
console.log(transformRef.current.object)
```

---

## 📊 Furniture Types

```
Seating: sofa, chair
Bedroom: bed
Dining: table
Lighting: lamp
Appliances: fan
Storage: cabinet
Decoration: plant
```

Use in code:
```javascript
addObject({
  type: 'sofa',  // Must match FURNITURE_CATALOG key
  position: [0, 0, 0]
})
```

---

## 🛠️ Common Code Patterns

### Save to Backend
```javascript
const saveLayout = async (objects) => {
  await fetch(`/api/layout/${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(objects)
  })
}
```

### Load from Backend
```javascript
const loadLayout = async (projectId) => {
  const res = await fetch(`/api/layout/${projectId}`)
  const data = await res.json()
  setObjects(data.objects)
}
```

### Call API with Auth
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

---

## 🚨 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| Cannot find module | `npm install` or `npm run install-all` |
| Port in use | `lsof -i :5000` → `kill -9 PID` |
| PostgreSQL not found | `brew services start postgresql` |
| Redis not found | `redis-server` or `docker run redis` |
| Python not found | Add Python to PATH |
| CORS error | Check `CORS_ORIGIN` in .env |
| 401 Unauthorized | Token expired or invalid |
| 404 Not Found | Endpoint doesn't exist or wrong URL |

---

## 📈 Performance Tips

```javascript
// Memoize expensive components
const MyComponent = React.memo(({ data }) => (...))

// Debounce property updates
const debouncedUpdate = debounce((id, updates) => {
  updateObject(id, updates)
}, 300)

// Lazy load furniture models
const furniture = lazy(() => import('./furniture'))

// Virtualize long lists
<VirtualList data={objects} />
```

---

## 🔐 Security Checklist

- [ ] Never commit .env file
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Validate all file uploads
- [ ] Use HTTPS in production
- [ ] Rotate keys periodically
- [ ] Monitor failed login attempts
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in nginx config

---

## 📚 Documentation Links

- Quick Start: `QUICKSTART.md`
- Setup Guide: `SETUP.md`
- API Reference: `API.md`
- Architecture: `ARCHITECTURE.md`
- Troubleshooting: `TROUBLESHOOTING.md`

---

## 🎯 Next Steps Template

```md
# Today's Tasks
- [ ] Feature: Add [feature name]
- [ ] Test: Verify [functionality]
- [ ] Bug: Fix [issue]
- [ ] Docs: Update [doc name]

# Testing Checklist
- [ ] Works in dev
- [ ] API response correct
- [ ] No console errors
- [ ] Tested in Firefox/Chrome
- [ ] Mobile responsive

# Before Commit
- [ ] Code formatted
- [ ] Comments added
- [ ] Tests passing
- [ ] No console errors
```

---

## 🆘 Need Help?

1. Check **TROUBLESHOOTING.md** first
2. Read **SETUP.md** for detailed info
3. Check **API.md** for endpoint details
4. Review **ARCHITECTURE.md** for system design

---

**Save this page! 💾**

Last Updated: 2024  
Quick Ref Version: 1.0
