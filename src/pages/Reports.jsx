import React, { useState, useEffect } from 'react'
import { Calendar, Eye, Trash2, Download, AlertCircle } from 'lucide-react'
import Header from '../layout/Header'
import PageWrapper from '../layout/PageWrapper'
import BottomNav from '../layout/BottomNav'
import { Button } from '../ui/Button'
import { Table } from '../ui/Table'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { useSales } from '../../hooks/useSales'
import { useStaff } from '../../hooks/useStaff'
import { formatCurrency, formatDateTime, generateReceiptNumber } from '../../utils/formatters'
import { exportToCSV } from '../../utils/export'
import toast from 'react-hot-toast'

export const Reports = () => {
  const { sales, voidSale } = useSales()
  const { staff } = useStaff()

  const [filteredSales, setFilteredSales] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCashier, setSelectedCashier] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [saleToVoid, setSaleToVoid] = useState(null)

  useEffect(() => {
    applyFilters()
  }, [startDate, endDate, selectedCashier, paymentFilter, statusFilter, sales])

  const applyFilters = () => {
    let filtered = [...sales]

    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter(s => new Date(s.timestamp) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59)
      filtered = filtered.filter(s => new Date(s.timestamp) <= end)
    }

    if (selectedCashier) {
      filtered = filtered.filter(s => s.cashierName === selectedCashier)
    }

    if (paymentFilter) {
      filtered = filtered.filter(s => s.paymentMethod === paymentFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    setFilteredSales(filtered)
  }

  const calculateTotals = () => {
    const completed = filteredSales.filter(s => s.status === 'completed')
    return {
      totalRevenue: completed.reduce((sum, s) => sum + s.totalAmount, 0),
      cashTotal: completed.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.totalAmount, 0),
      mpesaTotal: completed.filter(s => s.paymentMethod === 'mpesa').reduce((sum, s) => sum + s.totalAmount, 0),
      transactionCount: completed.length,
    }
  }

  const handleVoid = async () => {
    if (!voidReason.trim() || voidReason.length < 10) {
      toast.error('Void reason must be at least 10 characters')
      return
    }

    try {
      await voidSale(saleToVoid.id, voidReason, 'Admin')
      setShowVoidModal(false)
      setVoidReason('')
      setSaleToVoid(null)
      setSelectedSale(null)
      setShowDetailModal(false)
    } catch (err) {
      console.error('Error voiding sale:', err)
    }
  }

  const handleExport = () => {
    const exportData = filteredSales.map(sale => ({
      'Receipt #': generateReceiptNumber(sale.id),
      'Date/Time': formatDateTime(new Date(sale.timestamp)),
      'Cashier': sale.cashierName,
      'Items': sale.items.length,
      'Total': formatCurrency(sale.totalAmount),
      'Payment': sale.paymentMethod,
      'M-Pesa Code': sale.mpesaConfirmationCode || '-',
      'Status': sale.status,
    }))

    exportToCSV(exportData, 'sales-report.csv')
  }

  const totals = calculateTotals()
  const cashierOptions = staff.map(s => ({label: s.name, value: s.name}))

  const columns = [
    { key: 'id', label: 'Receipt #', render: (val) => generateReceiptNumber(val) },
    { key: 'timestamp', label: 'Date/Time', render: (val) => formatDateTime(new Date(val)) },
    { key: 'cashierName', label: 'Cashier' },
    { 
      key: 'items',
      label: 'Items',
      render: (val) => val.length,
    },
    { key: 'totalAmount', label: 'Total', render: (val) => formatCurrency(val) },
    {
      key: 'paymentMethod',
      label: 'Payment',
      render: (val) => val === 'mpesa' ? 'M-Pesa' : 'Cash',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'voided' ? 'danger' : 'success'}>
          {val === 'voided' ? 'VOIDED' : 'Completed'}
        </Badge>
      ),
    },
  ]

  return (
    <PageWrapper>
      <Header title="Sales Reports" />

      <div className="p-4 md:p-6 space-y-6 md:ml-64 min-h-screen">
        {/* Filters */}
        <div className="bg-white border-2 border-slate-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-slate-900">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Select
              label="Cashier"
              options={cashierOptions}
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              placeholder="All Cashiers"
            />
            <Select
              label="Payment Method"
              options={[
                { label: 'All', value: '' },
                { label: 'Cash', value: 'cash' },
                { label: 'M-Pesa', value: 'mpesa' },
              ]}
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            />
            <Select
              label="Status"
              options={[
                { label: 'All', value: '' },
                { label: 'Completed', value: 'completed' },
                { label: 'Voided', value: 'voided' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-teal-700">{formatCurrency(totals.totalRevenue)}</p>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Cash</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totals.cashTotal)}</p>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">M-Pesa</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totals.mpesaTotal)}</p>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-slate-900">{totals.transactionCount}</p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">Sales ({filteredSales.length})</h3>
            <Button onClick={handleExport} variant="secondary" size="sm">
              <Download size={16} className="inline mr-1" />
              Export
            </Button>
          </div>
          <Table
            columns={columns}
            data={filteredSales}
            onRowClick={(row) => {
              setSelectedSale(row)
              setShowDetailModal(true)
            }}
          />
        </div>
      </div>

      {/* Sale Detail Modal */}
      <Modal
        isOpen={showDetailModal && selectedSale}
        onClose={() => setShowDetailModal(false)}
        title="Sale Details"
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Receipt #</p>
                <p className="font-semibold text-slate-900">{generateReceiptNumber(selectedSale.id)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Status</p>
                <Badge variant={selectedSale.status === 'voided' ? 'danger' : 'success'}>
                  {selectedSale.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-600">Date/Time</p>
                <p className="font-semibold text-slate-900">{formatDateTime(new Date(selectedSale.timestamp))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Cashier</p>
                <p className="font-semibold text-slate-900">{selectedSale.cashierName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Payment Method</p>
                <p className="font-semibold text-slate-900">{selectedSale.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Total</p>
                <p className="font-semibold text-teal-700 text-lg">{formatCurrency(selectedSale.totalAmount)}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Items</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-slate-50 p-2 rounded">
                    <span className="text-slate-900">{item.drugName}</span>
                    <span className="text-slate-600">x{item.qty} @ {formatCurrency(item.unitPrice)}</span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedSale.status === 'completed' && (
              <Button
                variant="danger"
                onClick={() => {
                  setShowDetailModal(false)
                  setSaleToVoid(selectedSale)
                  setShowVoidModal(true)
                }}
                className="w-full"
              >
                <Trash2 size={16} className="inline mr-2" />
                Void This Sale
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Void Modal */}
      <Modal
        isOpen={showVoidModal}
        onClose={() => {
          setShowVoidModal(false)
          setVoidReason('')
        }}
        title="Void Sale"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-900">This action will restore stock and void the transaction.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Void Reason (minimum 10 characters)*
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 resize-none"
              rows="4"
              placeholder="Enter reason for voiding..."
            />
            <p className="text-xs text-slate-500 mt-1">
              {voidReason.length}/10 characters
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowVoidModal(false)
                setVoidReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleVoid}
              disabled={voidReason.length < 10}
            >
              Void Sale
            </Button>
          </div>
        </div>
      </Modal>

      <BottomNav />
    </PageWrapper>
  )
}

export default Reports
