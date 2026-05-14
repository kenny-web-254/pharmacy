import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const BottomNav = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const adminLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'POS', path: '/pos', icon: ShoppingCart },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
  ]

  const cashierLinks = [
    { label: 'POS', path: '/pos', icon: ShoppingCart },
  ]

  const links = user?.role === 'admin' ? adminLinks : cashierLinks

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden">
      <div className="flex justify-around">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(link.path)
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors
                ${active ? 'text-teal-700 border-t-2 border-teal-700' : 'text-slate-600'}
              `}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 text-center">{link.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-3 px-2 text-slate-600 hover:text-red-600 transition-colors"
        >
          <LogOut size={24} />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </nav>
  )
}

export default BottomNav
