import React, { useState } from 'react'
import { X } from 'lucide-react'

export const Modal = ({ isOpen, onClose, title, children, size = 'md', actions = null }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-lg ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <div className="flex gap-3 justify-end p-6 border-t border-slate-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
