import React, { useEffect, useState } from 'react'
import { TrendingUp, Package, ShoppingCart, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatters'

export const SummaryCard = ({ title, value, icon: Icon, color = 'teal', onClick = null }) => {
  const colors = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-lg p-6 space-y-2 transition-all ${colors[color]}
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-full opacity-75">
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

export const SummaryCards = ({ todayRevenue, todaySalesCount, inventoryValue, lowStockCount, onLowStockClick }) => {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <SummaryCard
        title="Today's Revenue"
        value={formatCurrency(todayRevenue)}
        icon={ShoppingCart}
        color="teal"
      />
      <SummaryCard
        title="Today's Sales"
        value={todaySalesCount.toString()}
        icon={TrendingUp}
        color="green"
      />
      <SummaryCard
        title="Inventory Value"
        value={formatCurrency(inventoryValue)}
        icon={Package}
        color="blue"
      />
      <SummaryCard
        title="Low Stock Items"
        value={lowStockCount.toString()}
        icon={AlertTriangle}
        color="amber"
        onClick={() => navigate('/inventory?filter=lowstock')}
      />
    </div>
  )
}

export default SummaryCards
