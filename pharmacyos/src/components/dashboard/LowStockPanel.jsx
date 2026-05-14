import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { db } from '../../db/db'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../utils/formatters'

export const LowStockPanel = ({ lowStockCount = 0 }) => {
  const [lowStockDrugs, setLowStockDrugs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const drugs = await db.drugs.toArray()
        const low = drugs.filter(d => d.quantity <= d.lowStockThreshold).slice(0, 5)
        setLowStockDrugs(low)
      } catch (err) {
        console.error('Error fetching low stock drugs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLowStock()
  }, [])

  return (
    <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-amber-600" />
        <h3 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h3>
      </div>

      {lowStockDrugs.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No low stock items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockDrugs.map((drug) => (
            <div key={drug.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{drug.name}</p>
                <p className="text-xs text-slate-600">
                  {drug.quantity} units (threshold: {drug.lowStockThreshold})
                </p>
              </div>
              <Badge variant="warning" size="sm">
                Reorder
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LowStockPanel
