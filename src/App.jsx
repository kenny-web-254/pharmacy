import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { initializeDatabase } from './db/db'
import { seedDatabase } from './db/seed'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Staff from './pages/Staff'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

// Route Protection
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/pos'} replace />
  }

  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/pos'} /> : <Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <POS />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute requiredRole="admin">
            <Inventory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute requiredRole="admin">
            <Staff />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" />} />
    </Routes>
  )
}

export const App = () => {
  useEffect(() => {
    // Initialize database on app load
    const initApp = async () => {
      try {
        await initializeDatabase()
        await seedDatabase()
      } catch (err) {
        console.error('Initialization error:', err)
      }
    }

    initApp()
  }, [])

  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </AuthProvider>
    </Router>
  )
}

export default App
