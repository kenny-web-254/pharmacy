import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export const Select = ({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  error = '',
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      
      <select
        value={value}
        onChange={onChange}
        className={`px-4 py-2 border-2 rounded-lg font-dm-sans transition-colors appearance-none bg-white
          ${error ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-teal-500'}
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-200' : 'focus:ring-teal-100'}
          ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}

export default Select
