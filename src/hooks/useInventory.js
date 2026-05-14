import { useState, useEffect } from 'react'
import { db } from '../db/db'
import toast from 'react-hot-toast'

export const useInventory = () => {
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch all drugs
  const fetchDrugs = async () => {
    setLoading(true)
    try {
      const allDrugs = await db.drugs.toArray()
      setDrugs(allDrugs)
      setError(null)
    } catch (err) {
      console.error('Error fetching drugs:', err)
      setError(err.message)
      toast.error('Failed to load drugs')
    } finally {
      setLoading(false)
    }
  }

  // Add drug
  const addDrug = async (drug) => {
    try {
      const id = await db.drugs.add({
        ...drug,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await fetchDrugs()
      toast.success('Drug added successfully')
      return id
    } catch (err) {
      console.error('Error adding drug:', err)
      toast.error('Failed to add drug')
      throw err
    }
  }

  // Update drug
  const updateDrug = async (id, updates) => {
    try {
      await db.drugs.update(id, {
        ...updates,
        updatedAt: new Date(),
      })
      await fetchDrugs()
      toast.success('Drug updated successfully')
    } catch (err) {
      console.error('Error updating drug:', err)
      toast.error('Failed to update drug')
      throw err
    }
  }

  // Delete drug (only if no sales)
  const deleteDrug = async (id) => {
    try {
      const sales = await db.sales.where('items').anyOf([{drugId: id}]).count()
      if (sales > 0) {
        throw new Error('Cannot delete drug with sales history')
      }
      await db.drugs.delete(id)
      await fetchDrugs()
      toast.success('Drug deleted successfully')
    } catch (err) {
      console.error('Error deleting drug:', err)
      toast.error(err.message || 'Failed to delete drug')
      throw err
    }
  }

  // Restock drug
  const restockDrug = async (id, quantity) => {
    try {
      const drug = await db.drugs.get(id)
      await db.drugs.update(id, {
        quantity: drug.quantity + quantity,
        updatedAt: new Date(),
      })
      await fetchDrugs()
      toast.success(`Restocked ${quantity} units`)
    } catch (err) {
      console.error('Error restocking:', err)
      toast.error('Failed to restock')
      throw err
    }
  }

  // Get low stock drugs
  const getLowStockDrugs = async () => {
    try {
      const lowStock = drugs.filter(d => d.quantity <= d.lowStockThreshold)
      return lowStock
    } catch (err) {
      console.error('Error getting low stock:', err)
      return []
    }
  }

  // Get expired drugs
  const getExpiredDrugs = async () => {
    try {
      const now = new Date()
      const expired = drugs.filter(d => new Date(d.expiryDate) < now)
      return expired
    } catch (err) {
      console.error('Error getting expired drugs:', err)
      return []
    }
  }

  // Search drugs
  const searchDrugs = (query) => {
    if (!query) return drugs
    const q = query.toLowerCase()
    return drugs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      d.barcode?.includes(q)
    )
  }

  useEffect(() => {
    fetchDrugs()
  }, [])

  return {
    drugs,
    loading,
    error,
    fetchDrugs,
    addDrug,
    updateDrug,
    deleteDrug,
    restockDrug,
    getLowStockDrugs,
    getExpiredDrugs,
    searchDrugs,
  }
}

export default useInventory
