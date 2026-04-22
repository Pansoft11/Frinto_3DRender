import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'))

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * Multer configuration for file uploads
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  // Only allow DXF files
  const allowedMimes = ['application/dxf', 'application/octet-stream']
  const allowedExts = ['.dxf']

  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedExts.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`Only DXF files are allowed. Got: ${ext}`))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

export default upload
