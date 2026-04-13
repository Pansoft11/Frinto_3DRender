# 🔍 Plan2Render - Troubleshooting & Verification Guide

## ✅ Pre-Flight Checklist

Run this before starting:

```bash
# Check Node.js
node --version
# Should be 18.0.0 or higher

# Check Python
python --version
# Should be 3.9+

# Check PostgreSQL
psql --version
# Should be 14+

# Check Redis
redis-cli --version
# Should be 7+

# Check npm
npm --version
# Should be 9+
```

---

## 🚀 Installation Verification

### Step 1: Verify Dependencies

```bash
# Install all packages
npm run install-all

# Check for errors - should see:
# npm notice
# added X packages in Xs
```

### Step 2: Verify Database

```bash
# Create/initialize database
cd backend
npm run migrate

# Expected output:
# 💾 Initializing database...
# ✅ Database initialized successfully
```

### Step 3: Verify Services Can Start

```bash
# Terminal 1: Frontend
npm run start-frontend
# Expected: http://localhost:5173

# Terminal 2: Backend (new terminal)
npm run start-backend
# Expected: ✅ Backend running on http://localhost:5000

# Terminal 3: Worker (new terminal)
npm run start-worker
# Expected: 🚀 Worker started, waiting for jobs...
```

---

## 🧪 Service Health Checks

### Frontend Health

```bash
# Open browser
http://localhost:5173

# You should see:
# ✅ Plan2Render header
# ✅ Furniture library panel (left)
# ✅ 3D viewport (center)
# ✅ Properties panel (right)
# ✅ Camera position display (top-left)
```

### Backend Health

```bash
# Terminal
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-15T10:00:00Z"}
```

### Redis Health

```bash
redis-cli ping

# Expected response:
# PONG
```

### PostgreSQL Health

```bash
psql -U postgres -d plan2render -c "SELECT COUNT(*) FROM users;"

# Expected response:
# count
# -------
#     0
# (1 row)
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module 'react'"

**Error Message:**
```
Error: Cannot find module 'react'
```

**Solution:**
```bash
cd frontend
npm install
cd ..
```

---

### Issue 2: "Connection refused" - PostgreSQL

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Diagnosis:**
```bash
# Check if PostgreSQL is running
psql --version

# Try connecting
psql -U postgres
```

**Solutions:**

**Option A: Start PostgreSQL (macOS with Homebrew)**
```bash
brew services start postgresql
```

**Option B: Start PostgreSQL (Windows)**
```
# Open Services (services.msc)
# Find "PostgreSQL XX"
# Right-click → Start
```

**Option C: Use Docker**
```bash
docker run -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -d postgres:15

# Then update .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plan2render
```

---

### Issue 3: "Connection refused" - Redis

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Diagnosis:**
```bash
redis-cli ping
# Should return: PONG
```

**Solutions:**

**Option A: Start Redis (macOS)**
```bash
brew services start redis
```

**Option B: Start Redis (Windows with WSL)**
```bash
# In WSL terminal
redis-server
```

**Option C: Use Docker**
```bash
docker run -p 6379:6379 -d redis:7

# Then update .env
REDIS_URL=redis://localhost:6379
```

---

### Issue 4: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution 1: Kill Process**
```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Solution 2: Use Different Port**
```bash
PORT=5001 npm run start-backend
VITE_API_URL=http://localhost:5001 npm run start-frontend
```

---

### Issue 5: Frontend Can't Connect to Backend API

**Error in Browser Console:**
```
Failed to fetch http://localhost:5000/api/...
CORS error...
```

**Solutions:**

1. **Check backend is running**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check VITE_API_URL**
   ```bash
   # frontend/vite.config.js should have proxy to :5000
   ```

3. **Check CORS_ORIGIN in backend**
   ```bash
   # backend/.env should allow localhost:5173
   CORS_ORIGIN=http://localhost:5173
   ```

---

### Issue 6: Python Processing Fails

**Error:**
```
python: No module named 'ezdxf'
```

**Solution:**
```bash
cd processing
pip install -r requirements.txt

# Verify installation
python -c "import ezdxf; print(ezdxf.__version__)"
# Should print version like: 1.3.3
```

---

### Issue 7: DXF Upload Stuck on "Processing"

**Error:**
```
Upload shows status: pending (forever)
```

**Diagnosis:**

1. Check if worker is running:
   ```bash
   # Terminal - should show: 🚀 Worker started
   npm run start-worker
   ```

2. Check Redis jobs:
   ```bash
   redis-cli
   > KEYS "bull:dxf-processing:*"
   # Should return job keys
   ```

3. Check worker logs:
   ```bash
   # In worker terminal - should show processing messages
   ```

**Solution:**
```bash
# Restart all services
# Terminal 1
npm run start-worker

# Terminal 2
npm run start-backend

# Wait 5 seconds, then try uploading again
```

---

### Issue 8: Database Migration Fails

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Ensure PostgreSQL is running first
# macOS
brew services start postgresql

# Then run migration
cd backend
npm run migrate
```

---

### Issue 9: "Cannot find Python" in Worker

**Error:**
```
Error: spawn ENOENT python
```

**Solution:**
```bash
# On Windows, Python must be in PATH
# Test Python directly
python --version

# If not found, add to PATH or use full path in worker.js
# Line to change:
const python = spawn('python3', [...])  # Use python3 instead
// or
const python = spawn('/usr/bin/python3', [...])  # Full path on Mac/Linux
```

---

### Issue 10: "Port 3000 already in use"

**Happens when:**
Vite development server conflicts with another app

**Solution:**
```bash
cd frontend
npm run dev -- --port 5174
# Then visit http://localhost:5174
```

---

## 🧪 Manual API Testing

### Create Account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "fullName": "Test User"
  }'

# Save the TOKEN from response
TOKEN="eyJhbGciOiJIUzI1...your_token_here"
```

### Create Project

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "My test project"
  }'

# Save PROJECT_ID from response
PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"
```

### Add Furniture via UI

```
1. Open http://localhost:5173
2. Click "Add Sofa" button in left panel
3. Sofa should appear in 3D view
4. Click the sofa
5. In right panel, change color
6. Click "Save" button
```

### Save Layout

```bash
curl -X POST http://localhost:5000/api/layout/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "objects": []
  }'

# Expected: Layout saved successfully
```

### Load Layout

```bash
curl -X GET http://localhost:5000/api/layout/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"

# Expected: Returns the saved layout data
```

---

## 📊 Performance Checks

### Frontend Performance

```
Browser DevTools (F12) → Performance tab

- Page load time: <3 seconds
- FPS: 60+ when dragging objects
- Memory: <200MB
```

### Backend Performance

```bash
# Time API response
time curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"

# Should be <100ms for empty projects
```

### Database Performance

```bash
psql -U postgres -d plan2render

# Count records
SELECT COUNT(*) FROM projects;

# Check indexes
\d projects
# Should show indexes on (user_id)
```

---

## 🔐 Security Checks

### Password Hashing

```bash
# Login should work
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!"}'

# Invalid password should fail
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrong"}'
# Should return: 401 Invalid credentials
```

### JWT Validation

```bash
# Without token - should fail
curl http://localhost:5000/api/projects

# With invalid token - should fail
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer invalid_token"

# With valid token - should work
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Final Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] PostgreSQL 14+ installed
- [ ] Redis 7+ installed
- [ ] `npm run install-all` completed without errors
- [ ] `npm run migrate` completed successfully
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend responds to http://localhost:5000/health
- [ ] Can register and login
- [ ] Can create projects
- [ ] Can add furniture to scene
- [ ] Can save layouts
- [ ] Can load layouts
- [ ] Worker can process jobs
- [ ] No console errors in DevTools

---

## 📞 Getting Help

If you're stuck:

1. **Check logs**: Look at terminal output for error messages
2. **Check ports**: `lsof -i :5000`, `lsof -i :5173`, etc.
3. **Check services**: Redis, PostgreSQL must be running
4. **Check .env**: Verify DATABASE_URL and REDIS_URL
5. **Restart services**: Stop all and start fresh
6. **Check docs**: See SETUP.md and API.md

---

## 🆘 Emergency Reset

If everything breaks:

```bash
# Stop all services (Ctrl+C in all terminals)

# Reset database
cd backend
npm run migrate  # This will recreate tables

# Clear Redis
redis-cli
> FLUSHALL
> exit

# Remove node_modules and reinstall
rm -rf node_modules
npm run install-all

# Restart services
npm run start-frontend &
npm run start-backend &
npm run start-worker &
```

---

**Everything should now work! 🎉**

If you still have issues, check the detailed guides:
- SETUP.md - Comprehensive setup guide
- ARCHITECTURE.md - Technical details
- API.md - API reference
