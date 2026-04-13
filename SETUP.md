# Plan2Render - Complete Setup & Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Running the Application](#running-the-application)
4. [API Documentation](#api-documentation)
5. [Database Schema](#database-schema)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/))
- **Redis** 7+ ([Download](https://redis.io/) or use Docker)
- **Git** ([Download](https://git-scm.com/))

### Optional but Recommended
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Postman** ([Download](https://www.postman.com/)) - for API testing
- **pgAdmin** ([Download](https://www.pgadmin.org/)) - for database management

---

## Local Development Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Plan2Render

# Copy environment template
copy .env.example .env

# Install all workspace dependencies
npm run install-all
```

### Step 2: Setup PostgreSQL

#### Option A: Using Docker (Recommended)

```bash
docker run --name plan2render-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=plan2render \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Manual Installation

```bash
# Create database
createdb plan2render

# Update .env file
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plan2render
```

### Step 3: Setup Redis

#### Option A: Using Docker

```bash
docker run --name plan2render-redis \
  -p 6379:6379 \
  -d redis:7
```

#### Option B: Manual Installation

On Windows with WSL2 or Docker:
```bash
redis-server
```

### Step 4: Run Database Migrations

```bash
cd backend
npm run migrate
```

Expected output:
```
💾 Initializing database...
✅ Database initialized successfully
```

### Step 5: Install Python Dependencies

```bash
cd processing
pip install -r requirements.txt
```

---

## Running the Application

### All-in-One (Requires 3 terminal windows)

**Terminal 1 - Frontend:**
```bash
npm run start-frontend
# Opens at http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
npm run start-backend
# Starts at http://localhost:5000
```

**Terminal 3 - Worker:**
```bash
npm run start-worker
# Starts processing jobs from queue
```

### Or use concurrent mode (single terminal):

```bash
npm run start-all
```

---

## 🌐 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}
```

### Projects

#### Get All Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Living Room Design",
  "description": "Modern living room layout"
}
```

#### Get Project Details
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "completed"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

### File Upload & Processing

#### Upload DXF File
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <dxf_file>
projectId: <project_id>
```

Response:
```json
{
  "file": {
    "id": "uuid",
    "original_name": "floor_plan.dxf",
    "file_path": "uploads/...",
    "file_size": 12345
  },
  "job": {
    "id": "job-id-123",
    "status": "pending"
  }
}
```

#### Check Job Status
```http
GET /api/upload/job/job-id-123
Authorization: Bearer <token>
```

#### Get Processed Output
```http
GET /api/output/:projectId
Authorization: Bearer <token>
```

Response:
```json
{
  "gltfUrl": "/outputs/project-uuid.glb",
  "job": { ... }
}
```

### Layout Management

#### Save Layout
```http
POST /api/layout/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "version": "1.0",
  "objects": [
    {
      "id": "obj-123",
      "type": "sofa",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "color": "#8B4513"
    }
  ]
}
```

#### Load Layout
```http
GET /api/layout/:projectId
Authorization: Bearer <token>
```

#### Get Layout History
```http
GET /api/layout/:projectId/history
Authorization: Bearer <token>
```

---

## 🗄️ Database Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Files
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  original_name VARCHAR(255),
  file_path VARCHAR(255),
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_at TIMESTAMP
)
```

### Jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  file_id UUID REFERENCES files(id),
  job_id VARCHAR(255) UNIQUE,
  status VARCHAR(50),
  progress INTEGER,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### Layouts
```sql
CREATE TABLE layouts (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  layout_data JSONB,
  version INTEGER,
  saved_by UUID REFERENCES users(id),
  saved_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🚀 Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment to VPS

1. **Setup Server**
```bash
# Ubuntu 22.04 example
sudo apt update
sudo apt install -y nodejs postgres redis-server python3-pip

# Clone repo
git clone <repo-url>
cd Plan2Render
```

2. **Setup Services**
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Start Redis
sudo systemctl start redis-server

# Install dependencies
npm run install-all
cd processing && pip install -r requirements.txt && cd ..
```

3. **Setup Environment**
```bash
# Edit .env for production
nano .env

# Run migrations
cd backend && npm run migrate
```

4. **Run Application**
```bash
# Option A: Using PM2 (recommended)
npm install -g pm2
pm2 start npm --name "plan2render-frontend" -- run start-frontend
pm2 start npm --name "plan2render-backend" -- run start-backend
pm2 start npm --name "plan2render-worker" -- run start-worker

# Option B: Using systemd services
# Create /etc/systemd/system/plan2render.service
```

---

## 🔧 Troubleshooting

### Issue: PostgreSQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Verify PostgreSQL is running: `psql --version`
2. Check DATABASE_URL in .env
3. Try creating database manually: `createdb plan2render`

### Issue: Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
1. Verify Redis is running: `redis-cli ping` (should return PONG)
2. Check REDIS_URL in .env
3. Restart Redis: `redis-server` or `docker start plan2render-redis`

### Issue: Python Processing Fails

```
ModuleNotFoundError: No module named 'ezdxf'
```

**Solution:**
```bash
cd processing
pip install -r requirements.txt
```

### Issue: Frontend doesn't connect to API

```
Failed to fetch http://localhost:5000/api/...
```

**Solution:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check VITE_API_URL in frontend/.env
3. Verify CORS_ORIGIN in backend/.env

### Issue: Jobs stuck in "pending" status

```
Solution: Worker may not be running
```

**Solution:**
1. Start worker: `npm run start-worker`
2. Check Redis connection
3. Check logs: `docker logs plan2render-worker`

---

## 📊 Monitoring & Performance

### View Active Jobs
```bash
redis-cli
> EVAL "return redis.call('keys','bull:dxf-processing:*')" 0
```

### Check Database Connections
```bash
psql -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

### Monitor Worker
```bash
# In worker terminal, logs show:
# 🔄 Processing DXF: floor_plan.dxf
# ✅ Job completed
# ❌ Job failed
```

---

## 🎯 Next Steps

1. **Add HTTPS** - Use Let's Encrypt with Nginx
2. **Setup CI/CD** - GitHub Actions for automated testing
3. **Add Email Notifications** - Notify users when processing completes
4. **Implement Caching** - Redis for GLTF files
5. **Add Real-time Collaboration** - WebSocket support
6. **Machine Learning** - Auto-detect furniture from floor plans

---

## 📞 Support

- **Issues**: Create GitHub issue
- **Discussions**: Use GitHub Discussions
- **Security**: Email security@plan2render.com

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**License**: MIT
