import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import uploadRoutes from './routes/upload.js'
import layoutRoutes from './routes/layout.js'
import layoutSaveRoutes from './routes/layoutSave.js'

// Middleware
import authMiddleware from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'))
const outputDir = path.resolve(process.env.OUTPUT_DIR || path.join(__dirname, '..', 'outputs'))
const frontendDist = path.resolve(process.env.FRONTEND_DIST || path.join(__dirname, '..', '..', 'frontend', 'dist'))

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Static files (uploaded files and output)
app.use('/uploads', express.static(uploadDir))
app.use('/outputs', express.static(outputDir))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes (public)
app.use('/api/auth', authRoutes)

// API Routes (protected - require auth)
app.use('/api/projects', authMiddleware, projectRoutes)
app.use('/api/upload', authMiddleware, uploadRoutes)
app.use('/api/layout', authMiddleware, layoutRoutes)

// Compatibility layout endpoints used by the editor save/load flow.
app.use('/', layoutSaveRoutes)

// Serve the production frontend from the same origin when available.
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/outputs')) {
      return next()
    }

    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
  console.log(`📚 API docs at http://localhost:${PORT}/api`)
})
