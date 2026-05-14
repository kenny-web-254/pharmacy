import { useState, useEffect } from 'react'
import { db } from '../db/db'
import toast from 'react-hot-toast'

export const useSales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch all sales
  const fetchSales = async () => {
    setLoading(true)
    try {
      const allSales = await db.sales.reverse().toArray()
      setSales(allSales)
      setError(null)
    } catch (err) {
      console.error('Error fetching sales:', err)
      setError(err.message)
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  // Create sale
  const createSale = async (sale) => {
    try {
      const id = await db.sales.add({
        ...sale,
        createdAt: new Date(),
      })
      await fetchSales()
      toast.success('Sale recorded successfully')
      return id
    } catch (err) {
      console.error('Error creating sale:', err)
      toast.error('Failed to record sale')
      throw err
    }
  }

  // Void sale (admin only)
  const voidSale = async (saleId, reason, voidedBy) => {
    try {
      // Get original sale
      const sale = await db.sales.get(saleId)
      if (!sale) throw new Error('Sale not found')

      // Update sale status
      await db.sales.update(saleId, {
        status: 'voided',
        voidReason: reason,
        voidedBy,
        voidedAt: new Date(),
      })

      // Restore stock for each item
      for (const item of sale.items) {
        const drug = await db.drugs.get(item.drugId)
        if (drug) {
          await db.drugs.update(item.drugId, {
            quantity: drug.quantity + item.qty,
            updatedAt: new Date(),
          })
        }
      }

      // Log void
      await db.voidLogs.add({
        saleId,
        receiptNumber: `RCP-${String(saleId).padStart(6, '0')}`,
        voidedBy,
        voidReason: reason,
        voidedAt: new Date(),
        totalAmount: sale.totalAmount,
      })

      await fetchSales()
      toast.success('Sale voided successfully')
    } catch (err) {
      console.error('Error voiding sale:', err)
      toast.error('Failed to void sale')
      throw err
    }
  }

  // Get sales for date range
  const getSalesForRange = async (startDate, endDate) => {
    try {
      const filtered = sales.filter(s => {
        const date = new Date(s.timestamp)
        return date >= startDate && date <= endDate
      })
      return filtered
    } catch (err) {
      console.error('Error filtering sales:', err)
      return []
    }
  }

  // Get sales by cashier
  const getSalesByCashier = async (cashierId) => {
    try {
      return sales.filter(s => s.cashierId === cashierId)
    } catch (err) {
      console.error('Error getting cashier sales:', err)
      return []
    }
  }

  // Get today's sales
  const getTodaysSales = async () => {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return await getSalesForRange(today, tomorrow)
    } catch (err) {
      console.error('Error getting today sales:', err)
      return []
    }
  }

  // Calculate totals
  const calculateTotals = (filteredSales = sales) => {
    const completed = filteredSales.filter(s => s.status === 'completed')
    const totalRevenue = completed.reduce((sum, s) => sum + s.totalAmount, 0)
    const cashTotal = completed
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, s) => sum + s.totalAmount, 0)
    const mpesaTotal = completed
      .filter(s => s.paymentMethod === 'mpesa')
      .reduce((sum, s) => sum + s.totalAmount, 0)

    return {
      totalRevenue,
      cashTotal,
      mpesaTotal,
      transactionCount: completed.length,
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  return {
    sales,
    loading,
    error,
    fetchSales,
    createSale,
    voidSale,
    getSalesForRange,
    getSalesByCashier,
    getTodaysSales,
    calculateTotals,
  }
}

export default useSales
