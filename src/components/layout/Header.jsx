import React, { useState } from 'react'
import { Menu, Wifi, WifiOff } from 'lucide-react'
import Sidebar from './Sidebar'

export const Header = ({ title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          </div>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <WifiOff size={16} />
              <span>Offline</span>
            </div>
          )}
          {isOnline && (
            <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs">
              <Wifi size={14} />
              <span>Online</span>
            </div>
          )}
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}

export default Header
