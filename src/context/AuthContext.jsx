import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSession, logoutUser } from '../utils/auth'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const session = getSession()
    if (session) {
      setUser({
        id: session.userId,
        name: session.name,
        role: session.role,
        forcePasswordChange: session.forcePasswordChange,
      })
    }
    setLoading(false)
  }, [])

  const logout = () => {
    logoutUser()
    setUser(null)
  }

  const setUserSession = (userData) => {
    setUser(userData)
  }

  return (
    <AuthContext.Provider value={{ user, setUserSession, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
