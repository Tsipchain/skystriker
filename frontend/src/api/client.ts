/**
 * Lightweight API client for the SkyStriker backend.
 *
 * Uses native fetch – no axios dependency required.
 */

const API_BASE = import.meta.env.VITE_API_URL || ''

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = opts

  const token = localStorage.getItem('skystriker_token') || ''
  const guideId = localStorage.getItem('skystriker_guide_id') || ''
  const adminToken = localStorage.getItem('skystriker_admin_token') || ''

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(guideId ? { 'X-Guide-Id': guideId } : {}),
      ...(adminToken ? { 'X-Admin-Token': adminToken } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    // Auto-logout on 401 (expired / invalid token)
    if (res.status === 401 && token && !path.includes('/auth/')) {
      localStorage.removeItem('skystriker_token')
      localStorage.removeItem('skystriker_user')
      localStorage.removeItem('skystriker_guide_id')
      localStorage.removeItem('skystriker_admin_token')
      window.location.href = '/auth'
      throw new Error('Session expired – please log in again')
    }
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.detail || `Request failed: ${res.status}`)
  }

  return res.json()
}

const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export default api
