import React from 'react'

export const PageWrapper = ({ children, title = '' }) => {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-6">
      {children}
    </div>
  )
}

export default PageWrapper
