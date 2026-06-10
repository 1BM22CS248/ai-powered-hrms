const TOKEN_KEY = 'hrms-token'

// Keep localStorage token for backward compatibility during cookie migration.
// Requests also send credentials: 'include' so the httpOnly cookie is used.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    credentials: 'include', // send httpOnly cookie on every request (H-6 fix)
    headers: {
      'Content-Type': 'application/json',
      // Also send Authorization header as fallback for environments without cookie support
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || json.message || `Request failed (${res.status})`)
  return json.data as T
}

export const api = {
  get:   <T>(path: string) => request<T>(path),
  post:  <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:   <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del:   <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
