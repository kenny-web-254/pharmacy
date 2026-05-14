import React from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export const PaymentPieChart = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border-2 border-slate-200 rounded-lg p-6 h-80 flex items-center justify-center">
        <div className="text-slate-500">Loading chart...</div>
      </div>
    )
  }

  const COLORS = ['#0f766e', '#10b981']

  return (
    <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Method Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PaymentPieChart
