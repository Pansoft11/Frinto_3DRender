import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import uploadRoutes from './routes/upload.js'
import layoutRoutes from './routes/layout.js'

// Middleware
import authMiddleware from './middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Static files (uploaded files and output)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))
app.use('/outputs', express.static(path.join(__dirname, '..', 'outputs')))

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
