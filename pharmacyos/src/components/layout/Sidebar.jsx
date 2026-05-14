import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../utils/auth'

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const adminLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'POS', path: '/pos', icon: ShoppingCart },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Staff', path: '/staff', icon: Users },
    { label: 'Settings', path: '/settings', icon: Settings },
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
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-slate-950 text-white shadow-lg transform transition-transform duration-300 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:z-auto`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-dm-sans font-medium text-lg">Pharmacy</span>
              <span className="font-dm-sans font-bold text-lg text-teal-500">OS</span>
            </div>
            <button onClick={onClose} className="md:hidden -mr-2">
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">{user?.role === 'admin' ? 'Administrator' : 'Cashier'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${active
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                  }`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
