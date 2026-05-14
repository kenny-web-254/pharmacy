import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, RefreshCw, Download } from 'lucide-react'
import Header from '../layout/Header'
import PageWrapper from '../layout/PageWrapper'
import BottomNav from '../layout/BottomNav'
import { Button } from '../ui/Button'
import { Table } from '../ui/Table'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useInventory } from '../../hooks/useInventory'
import { formatCurrency,formatDate } from '../../utils/formatters'
import { exportToCSV } from '../../utils/export'
import toast from 'react-hot-toast'

export const Inventory = () => {
  const {
    drugs,
    loading,
    addDrug,
    updateDrug,
    deleteDrug,
    restockDrug,
  } = useInventory()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    unit: 'tablet',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    lowStockThreshold: '20',
    expiryDate: '',
    barcode: '',
    description: '',
    requiresPrescription: false,
  })
  const [restockId, setRestockId] = useState(null)
  const [restockAmount, setRestockAmount] = useState('')

  const categories = [
    'Analgesic', 'Antibiotic', 'NSAID', 'Antidiabetic', 'Antihistamine',
    'Vitamin', 'Supplement', 'Topical', 'Syrup', 'Injection'
  ]

  const units = ['tablet', 'bottle', 'sachet', 'vial', 'cream', 'syrup', 'capsule', 'injection']

  const handleAddClick = () => {
    setEditingId(null)
    setFormData({
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      unit: 'tablet',
      costPrice: '',
      sellingPrice: '',
      quantity: '',
      lowStockThreshold: '20',
      expiryDate: '',
      barcode: '',
      description: '',
      requiresPrescription: false,
    })
    setShowForm(true)
  }

  const handleEditClick = (drug) => {
    setEditingId(drug.id)
    setFormData({
      name: drug.name,
      genericName: drug.genericName,
      category: drug.category,
      manufacturer: drug.manufacturer,
      unit: drug.unit,
      costPrice: drug.costPrice.toString(),
      sellingPrice: drug.sellingPrice.toString(),
      quantity: drug.quantity.toString(),
      lowStockThreshold: drug.lowStockThreshold.toString(),
      expiryDate: drug.expiryDate?.split('T')[0] || '',
      barcode: drug.barcode || '',
      description: drug.description || '',
      requiresPrescription: drug.requiresPrescription || false,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.sellingPrice || !formData.costPrice) {
      toast.error('Please fill in all required fields')
      return
    }

    const costPrice = parseFloat(formData.costPrice)
    const sellingPrice = parseFloat(formData.sellingPrice)

    if (sellingPrice < costPrice) {
      toast.error('Selling price must be greater than or equal to cost price')
      return
    }

    try {
      const drugData = {
        ...formData,
        costPrice,
        sellingPrice,
        quantity: parseInt(formData.quantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
      }

      if (editingId) {
        await updateDrug(editingId, drugData)
      } else {
        await addDrug(drugData)
      }

      setShowForm(false)
    } catch (err) {
      console.error('Error saving drug:', err)
    }
  }

  const handleRestock = async () => {
    if (!restockAmount || restockAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    try {
      await restockDrug(restockId, parseInt(restockAmount))
      setRestockId(null)
      setRestockAmount('')
    } catch (err) {
      console.error('Error restocking:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return

    try {
      await deleteDrug(id)
    } catch (err) {
      console.error('Error deleting drug:', err)
    }
  }

  const handleExport = () => {
    const exportData = drugs.map(drug => ({
      Name: drug.name,
      'Generic Name': drug.genericName,
      Category: drug.category,
      Manufacturer: drug.manufacturer,
      Unit: drug.unit,
      'Cost Price': drug.costPrice,
      'Selling Price': drug.sellingPrice,
      Stock: drug.quantity,
      'Low Stock Threshold': drug.lowStockThreshold,
      'Expiry Date': formatDate(drug.expiryDate),
      Barcode: drug.barcode || '-',
      'Requires Prescription': drug.requiresPrescription ? 'Yes' : 'No',
    }))

    exportToCSV(exportData, 'inventory.csv')
  }

  const getStockStatus = (drug) => {
    if (drug.quantity === 0) return { color: 'danger', label: 'Out of Stock' }
    if (drug.quantity <= drug.lowStockThreshold) return { color: 'warning', label: 'Low Stock' }
    return { color: 'success', label: 'In Stock' }
  }

  const columns = [
    { key: 'name', label: 'Drug Name', width: '200px' },
    { key: 'category', label: 'Category' },
    { key: 'sellingPrice', label: 'Price', render: (val) => formatCurrency(val) },
    { key: 'quantity', label: 'Stock' },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = getStockStatus(row)
        return <Badge variant={status.color}>{status.label}</Badge>
      },
    },
    {
      key: 'action',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="p-1 hover:bg-blue-100 rounded"
          >
            <Edit size={16} className="text-blue-600" />
          </button>
          <button
            onClick={() => setRestockId(row.id)}
            className="p-1 hover:bg-green-100 rounded"
          >
            <RefreshCw size={16} className="text-green-600" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 hover:bg-red-100 rounded"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageWrapper>
      <Header title="Inventory" />

      <div className="p-4 md:p-6 space-y-4 md:ml-64 min-h-screen">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Drug Inventory</h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExport} variant="secondary">
              <Download size={18} className="inline mr-1" />
              Export
            </Button>
            <Button onClick={handleAddClick}>
              <Plus size={18} className="inline mr-1" />
              Add Drug
            </Button>
          </div>
        </div>

        <Table columns={columns} data={drugs} isLoading={loading} />
      </div>

      {/* Drug Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Drug' : 'Add New Drug'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Drug Name*"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <Input
              label="Generic Name"
              value={formData.genericName}
              onChange={(e) => setFormData({...formData, genericName: e.target.value})}
            />
            <Select
              label="Category*"
              options={categories.map(c => ({label: c, value: c}))}
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
            <Input
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
            />
            <Select
              label="Unit*"
              options={units.map(u => ({label: u, value: u}))}
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
            <Input
              label="Cost Price*"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
              required
            />
            <Input
              label="Selling Price*"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
              required
            />
            <Input
              label="Opening Stock"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
            />
            <Input
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({...formData, barcode: e.target.value})}
            />
          </div>
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresPrescription}
              onChange={(e) => setFormData({...formData, requiresPrescription: e.target.checked})}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium">Requires Prescription</span>
          </label>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? 'Update' : 'Add'} Drug
            </Button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={restockId !== null}
        onClose={() => setRestockId(null)}
        title="Restock Drug"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Quantity to Add"
            type="number"
            min="1"
            value={restockAmount}
            onChange={(e) => setRestockAmount(e.target.value)}
            placeholder="Enter quantity"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRestockId(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestock}>
              Restock
            </Button>
          </div>
        </div>
      </Modal>

      <BottomNav />
    </PageWrapper>
  )
}

export default Inventory
