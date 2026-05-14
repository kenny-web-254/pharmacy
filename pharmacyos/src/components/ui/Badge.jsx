import React from 'react'

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: 'bg-slate-200 text-slate-900',
    primary: 'bg-teal-100 text-teal-900',
    success: 'bg-emerald-100 text-emerald-900',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-900',
    info: 'bg-blue-100 text-blue-900',
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span className={`inline-block font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
