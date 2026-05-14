import React from 'react'

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl text-slate-600 mb-6">Page not found</p>
        <a href="/" className="text-teal-700 hover:underline">
          Go back to home
        </a>
      </div>
    </div>
  )
}

export default NotFound
