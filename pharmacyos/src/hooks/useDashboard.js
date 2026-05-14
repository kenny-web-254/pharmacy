import { useState, useEffect } from 'react'
import { db } from '../db/db'

export const useDashboard = () => {
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todaySalesCount, setTodaySalesCount] = useState(0)
  const [inventoryValue, setInventoryValue] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get today's revenue
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todaysSales = await db.sales
        .where('timestamp')
        .between(today, tomorrow)
        .toArray()

      const completedSales = todaysSales.filter(s => s.status === 'completed')
      const revenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0)
      setTodayRevenue(revenue)
      setTodaySalesCount(completedSales.length)

      // Get inventory value
      const allDrugs = await db.drugs.toArray()
      const totalCost = allDrugs.reduce((sum, d) => sum + (d.costPrice * d.quantity), 0)
      setInventoryValue(totalCost)

      // Get low stock count
      const lowStock = allDrugs.filter(d => d.quantity <= d.lowStockThreshold)
      setLowStockCount(lowStock.length)

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setLoading(false)
    }
  }

  // Get revenue for last 7 days
  const getRevenueLastWeek = async () => {
    try {
      const data = []
      const now = new Date()

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const sales = await db.sales
          .where('timestamp')
          .between(date, nextDate)
          .toArray()

        const revenue = sales
          .filter(s => s.status === 'completed')
          .reduce((sum, s) => sum + s.totalAmount, 0)

        data.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          revenue,
        })
      }

      return data
    } catch (error) {
      console.error('Error getting weekly revenue:', error)
      return []
    }
  }

  // Get payment method breakdown
  const getPaymentBreakdown = async () => {
    try {
      const allSales = await db.sales.toArray()
      const completed = allSales.filter(s => s.status === 'completed')

      const cash = completed
        .filter(s => s.paymentMethod === 'cash')
        .reduce((sum, s) => sum + s.totalAmount, 0)

      const mpesa = completed
        .filter(s => s.paymentMethod === 'mpesa')
        .reduce((sum, s) => sum + s.totalAmount, 0)

      const total = cash + mpesa

      return [
        { name: 'Cash', value: total > 0 ? (cash / total * 100).toFixed(1) : 0 },
        { name: 'M-Pesa', value: total > 0 ? (mpesa / total * 100).toFixed(1) : 0 },
      ]
    } catch (error) {
      console.error('Error getting payment breakdown:', error)
      return []
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return {
    todayRevenue,
    todaySalesCount,
    inventoryValue,
    lowStockCount,
    loading,
    reloadDashboard: loadDashboardData,
    getRevenueLastWeek,
    getPaymentBreakdown,
  }
}

export default useDashboard
