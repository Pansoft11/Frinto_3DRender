const DEFAULT_PRODUCTION_API_URL = 'https://plan2render-backend.onrender.com'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const fallbackApiUrl = import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : ''

export const API_BASE_URL = (configuredApiUrl || fallbackApiUrl).replace(/\/$/, '')

console.info('VITE_API_URL:', API_BASE_URL || '(same-origin)')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options)
}
