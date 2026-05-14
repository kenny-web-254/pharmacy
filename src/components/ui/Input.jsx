import React from 'react'

export const Input = ({
  label,
  type = 'text',
  placeholder = '',
  error = '',
  helpText = '',
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      
      <input
        type={type}
        placeholder={placeholder}
        className={`px-4 py-2 border-2 rounded-lg font-dm-sans transition-colors
          ${error ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-teal-500'}
          focus:outline-none focus:ring-2 
          ${error ? 'focus:ring-red-200' : 'focus:ring-teal-100'}
          ${className}`}
        {...props}
      />

      {error && <span className="text-sm text-red-600">{error}</span>}
      {helpText && !error && <span className="text-sm text-slate-500">{helpText}</span>}
    </div>
  )
}

export default Input
