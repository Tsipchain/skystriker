import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../api/client'
import type { AuthUser, AuthResponse } from '../types'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, fullName: string, role: string) => Promise<void>
  googleLogin: (idToken: string, role: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function setSession(token: string, user: AuthUser) {
  localStorage.setItem('skystriker_token', token)
  localStorage.setItem('skystriker_user', JSON.stringify(user))
  if (user.guide_id) {
    localStorage.setItem('skystriker_guide_id', user.guide_id)
  }
  if (user.role === 'admin') {
    localStorage.setItem('skystriker_admin_token', 'skystriker-admin')
  }
}

function clearSession() {
  localStorage.removeItem('skystriker_token')
  localStorage.removeItem('skystriker_user')
  localStorage.removeItem('skystriker_guide_id')
  localStorage.removeItem('skystriker_admin_token')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('skystriker_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/api/v1/auth/login', { email, password })
    setSession(res.token, res.user)
    setUser(res.user)
  }

  async function signup(email: string, password: string, fullName: string, role: string) {
    const res = await api.post<AuthResponse>('/api/v1/auth/signup', {
      email,
      password,
      full_name: fullName,
      role,
    })
    setSession(res.token, res.user)
    setUser(res.user)
  }

  async function googleLogin(idToken: string, role: string) {
    const res = await api.post<AuthResponse>('/api/v1/auth/google', {
      id_token: idToken,
      role,
    })
    setSession(res.token, res.user)
    setUser(res.user)
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
