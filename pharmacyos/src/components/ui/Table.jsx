import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const Table = ({
  columns = [],
  data = [],
  onRowClick = null,
  isLoading = false,
  emptyMessage = 'No data found',
}) => {
  const [page, setPage] = useState(0)
  const pageSize = 20
  const totalPages = Math.ceil(data.length / pageSize)
  const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize)

  if (data.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Table wrapper for horizontal scrolling on mobile */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-200 transition-colors ${
                  onRowClick ? 'hover:bg-slate-50 cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={`${idx}-${col.key}`} className="px-4 py-3">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 hover:bg-slate-100 disabled:opacity-50 rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table
