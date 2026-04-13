# Plan2Render API Reference

Complete API documentation with examples.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All authenticated endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

Get a token by registering or logging in.

---

## 🔐 Authentication Endpoints

### Register User

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing required fields
- `400` - User already exists

---

### Login User

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

## 📁 Project Endpoints

### List All Projects

**Endpoint:** `GET /projects`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Living Room Design",
    "description": "Modern living room layout",
    "status": "active",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
]
```

---

### Create Project

**Endpoint:** `POST /projects`

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Bedroom Design",
  "description": "Master bedroom interior layout"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Bedroom Design",
  "description": "Master bedroom interior layout",
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

---

### Get Project Details

**Endpoint:** `GET /projects/:id`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Living Room Design",
  "description": "Modern living room layout",
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

---

### Update Project

**Endpoint:** `PUT /projects/:id`

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Updated Living Room",
  "status": "completed"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Living Room",
  "status": "completed",
  "updated_at": "2024-01-15T15:00:00Z"
}
```

---

### Delete Project

**Endpoint:** `DELETE /projects/:id`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
{
  "message": "Project deleted"
}
```

---

## 📤 File Upload & Processing

### Upload DXF File

**Endpoint:** `POST /upload`

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [DXF_FILE]
projectId: 550e8400-e29b-41d4-a716-446655440000
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@floor_plan.dxf" \
  -F "projectId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:** `201 Created`
```json
{
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "original_name": "floor_plan.dxf",
    "file_path": "uploads/1705319400000-abc123-floor_plan.dxf",
    "file_type": "dxf",
    "file_size": 45678
  },
  "job": {
    "id": "job-1705319400000",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `400` - No file uploaded
- `400` - Project ID required
- `403` - Access denied
- `413` - File too large (max 50MB)

---

### Check Job Status

**Endpoint:** `GET /upload/job/:jobId`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_id": "job-1705319400000",
  "status": "processing",
  "progress": 45,
  "result": null,
  "error_message": null,
  "started_at": "2024-01-15T10:00:30Z",
  "completed_at": null,
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Status Values:**
- `pending` - Waiting to process
- `processing` - Currently processing
- `completed` - Successfully processed
- `failed` - Processing failed

---

### Get Processed Output

**Endpoint:** `GET /output/:projectId`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
{
  "gltfUrl": "/outputs/550e8400-e29b-41d4-a716-446655440000.glb",
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "completed",
    "result": {
      "projectId": "550e8400-e29b-41d4-a716-446655440000",
      "gltfPath": "/outputs/550e8400-e29b-41d4-a716-446655440000.glb",
      "geometry": {
        "walls": 12,
        "doors": 3,
        "windows": 8
      },
      "status": "success"
    },
    "completed_at": "2024-01-15T10:02:00Z"
  }
}
```

**Errors:**
- `404` - No completed jobs found
- `404` - GLTF not ready

---

## 💾 Layout Management

### Save Layout

**Endpoint:** `POST /layout/:projectId`

**Headers:**
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

**Request:**
```json
{
  "version": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "baseModel": null,
  "objects": [
    {
      "id": "obj-1-abc123",
      "type": "sofa",
      "position": [2.5, 0, 3.0],
      "rotation": [0, 1.57, 0],
      "scale": [1, 1, 1],
      "color": "#8B4513",
      "metadata": {}
    },
    {
      "id": "obj-2-def456",
      "type": "table",
      "position": [0, 0, 2.0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "color": "#654321",
      "metadata": {}
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "Layout saved",
  "layout": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 1,
    "saved_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### Load Latest Layout

**Endpoint:** `GET /layout/:projectId`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
{
  "version": "1.0",
  "timestamp": "2024-01-15T10:00:00Z",
  "baseModel": null,
  "objects": [
    {
      "id": "obj-1-abc123",
      "type": "sofa",
      "position": [2.5, 0, 3.0],
      "rotation": [0, 1.57, 0],
      "scale": [1, 1, 1],
      "color": "#8B4513"
    }
  ]
}
```

---

### Get Layout History

**Endpoint:** `GET /layout/:projectId/history`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "version": 3,
    "saved_at": "2024-01-15T15:00:00Z",
    "updated_at": "2024-01-15T15:00:00Z",
    "saved_by": "john_doe"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "version": 2,
    "saved_at": "2024-01-15T14:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z",
    "saved_by": "john_doe"
  }
]
```

---

### Delete Layout

**Endpoint:** `DELETE /layout/:projectId`

**Headers:**
```
Authorization: Bearer <TOKEN>
```

**Response:** `200 OK`
```json
{
  "message": "Layout deleted"
}
```

---

## 🏥 Health Check

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `413` | Payload Too Large |
| `500` | Server Error |

---

## 🧪 Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Save token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create project
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project"}'

# Upload file
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.dxf" \
  -F "projectId=<project-id>"

# Check health
curl http://localhost:5000/health
```

---

## 📝 Postman Collection

Import this into Postman:

```
https://www.postman.com/collections/plan2render-api
```

Or manually create requests using examples above.

---

## 🔒 Security

- Passwords are hashed with bcryptjs
- JWTs expire after 7 days
- All file uploads validated
- SQL injection protected with parameterized queries
- CORS enabled for localhost:5173

---

**Last Updated:** 2024  
**API Version:** 1.0.0
