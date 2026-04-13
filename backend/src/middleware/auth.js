import jwt from 'jsonwebtoken'

/**
 * Authentication middleware - verify JWT token
 */
export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      // For development, allow requests without token
      if (process.env.NODE_ENV === 'development') {
        req.userId = 'dev-user-1'
        return next()
      }
      return res.status(401).json({ error: 'Missing token' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    req.userId = decoded.userId
    next()
  } catch (error) {
    console.error('Auth error:', error.message)
    
    // In development, allow all requests
    if (process.env.NODE_ENV === 'development') {
      req.userId = 'dev-user-1'
      return next()
    }
    
    res.status(401).json({ error: 'Invalid token' })
  }
}
