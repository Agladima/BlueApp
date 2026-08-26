const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem('blueapp:token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed')
  }
  return payload
}

export const api = { request, API_BASE }

export async function pingBackend() {
  try {
    await fetch(`${API_BASE}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
  } catch {
    // Best-effort keepalive only.
  }
}
