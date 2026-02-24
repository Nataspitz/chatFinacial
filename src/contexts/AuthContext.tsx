import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

const AUTH_STORAGE_KEY = 'chatfinancial.auth'

interface AuthState {
  userName: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  userName: string | null
  login: (userName: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const readAuthStorage = (): AuthState | null => {
  const rawAuth = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawAuth) return null

  try {
    const parsedAuth = JSON.parse(rawAuth) as AuthState
    if (typeof parsedAuth.userName !== 'string' || !parsedAuth.userName.trim()) {
      return null
    }
    return { userName: parsedAuth.userName.trim() }
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [authState, setAuthState] = useState<AuthState | null>(() => readAuthStorage())

  const login = (userName: string): void => {
    const nextState = { userName: userName.trim() }
    setAuthState(nextState)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState))
  }

  const logout = (): void => {
    setAuthState(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: authState !== null,
      userName: authState?.userName ?? null,
      login,
      logout
    }),
    [authState]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
