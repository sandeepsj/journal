import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

interface User {
  name: string
  email: string
  picture: string | null
}

interface AuthContextValue {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

async function fetchUserInfo(token: string): Promise<User | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      name: data.name || data.email || 'User',
      email: data.email || '',
      picture: data.picture || null,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null)

  // Handle token response from GIS
  const handleTokenResponse = useCallback(async (response: google.accounts.oauth2.TokenResponse) => {
    if (response.error) {
      console.error('[Auth] Token error:', response.error)
      return
    }

    const token = response.access_token
    sessionStorage.setItem('access_token', token)
    setAccessToken(token)

    const userInfo = await fetchUserInfo(token)
    if (userInfo) {
      setUser(userInfo)
    }
  }, [])

  // Initialize GIS token client
  useEffect(() => {
    if (!CLIENT_ID) {
      setIsLoading(false)
      return
    }

    function initClient() {
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
      })
      // Try restoring session from sessionStorage
      restoreSession()
    }

    // Wait for GIS script to load
    if (window.google?.accounts?.oauth2) {
      initClient()
    } else {
      // GIS script might still be loading
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(check)
          initClient()
        }
      }, 100)
      // Give up after 10s
      setTimeout(() => {
        clearInterval(check)
        setIsLoading(false)
      }, 10000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function restoreSession() {
    const storedToken = sessionStorage.getItem('access_token')
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    const userInfo = await fetchUserInfo(storedToken)
    if (userInfo) {
      setAccessToken(storedToken)
      setUser(userInfo)
    } else {
      // Token expired or invalid
      sessionStorage.removeItem('access_token')
    }
    setIsLoading(false)
  }

  const signIn = useCallback(() => {
    if (!tokenClientRef.current) {
      console.error('[Auth] Token client not initialized. Is VITE_GOOGLE_CLIENT_ID set?')
      return
    }
    tokenClientRef.current.requestAccessToken()
  }, [])

  const signOut = useCallback(() => {
    const token = accessToken
    if (token) {
      google.accounts.oauth2.revoke(token, () => {})
    }
    sessionStorage.removeItem('access_token')
    setAccessToken(null)
    setUser(null)
  }, [accessToken])

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
