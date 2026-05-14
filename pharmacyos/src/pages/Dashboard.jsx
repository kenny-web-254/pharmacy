import React, { useEffect, useState } from 'react'
import { useDashboard } from '../../hooks/useDashboard'
import Header from '../layout/Header'
import PageWrapper from '../layout/PageWrapper'
import BottomNav from '../layout/BottomNav'
import SummaryCards from '../dashboard/SummaryCards'
import RevenueChart from '../dashboard/RevenueChart'
import PaymentPieChart from '../dashboard/PaymentPieChart'
import LowStockPanel from '../dashboard/LowStockPanel'
import { Skeleton } from '../ui/Skeleton'

export const Dashboard = () => {
  const {
    todayRevenue,
    todaySalesCount,
    inventoryValue,
    lowStockCount,
    loading,
    getRevenueLastWeek,
    getPaymentBreakdown,
  } = useDashboard()

  const [chartData, setChartData] = useState([])
  const [paymentData, setPaymentData] = useState([])

  useEffect(() => {
    const loadCharts = async () => {
      const revenue = await getRevenueLastWeek()
      const payment = await getPaymentBreakdown()
      setChartData(revenue)
      setPaymentData(payment)
    }
    loadCharts()
  }, [])

  return (
    <PageWrapper>
      <Header title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6 md:ml-64">
        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <SummaryCards
            todayRevenue={todayRevenue}
            todaySalesCount={todaySalesCount}
            inventoryValue={inventoryValue}
            lowStockCount={lowStockCount}
          />
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={chartData} loading={loading} />
          <PaymentPieChart data={paymentData} loading={loading} />
        </div>

        {/* Low Stock Panel */}
        <LowStockPanel lowStockCount={lowStockCount} />
      </div>

      <BottomNav />
    </PageWrapper>
  )
}

export default Dashboard
