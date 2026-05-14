import { useState, useEffect } from 'react'
import { db } from '../db/db'
import toast from 'react-hot-toast'

export const useStaff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch all staff
  const fetchStaff = async () => {
    setLoading(true)
    try {
      const allStaff = await db.users.toArray()
      setStaff(allStaff)
      setError(null)
    } catch (err) {
      console.error('Error fetching staff:', err)
      setError(err.message)
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  // Add staff member
  const addStaff = async (staffData) => {
    try {
      const { hashPin } = await import('../db/db')
      const hashedPin = await hashPin(staffData.pin)

      const id = await db.users.add({
        name: staffData.name,
        role: staffData.role,
        pin: hashedPin,
        status: 'active',
        dateAdded: new Date(),
        lastLogin: null,
        addedBy: staffData.addedBy,
      })

      await fetchStaff()
      toast.success('Staff member added successfully')
      return id
    } catch (err) {
      console.error('Error adding staff:', err)
      toast.error('Failed to add staff member')
      throw err
    }
  }

  // Update staff
  const updateStaff = async (id, updates) => {
    try {
      await db.users.update(id, updates)
      await fetchStaff()
      toast.success('Staff member updated successfully')
    } catch (err) {
      console.error('Error updating staff:', err)
      toast.error('Failed to update staff')
      throw err
    }
  }

  // Deactivate staff
  const deactivateStaff = async (id) => {
    try {
      await db.users.update(id, { status: 'inactive' })
      await fetchStaff()
      toast.success('Staff member deactivated')
    } catch (err) {
      console.error('Error deactivating staff:', err)
      toast.error('Failed to deactivate staff')
      throw err
    }
  }

  // Reactivate staff
  const reactivateStaff = async (id) => {
    try {
      await db.users.update(id, { status: 'active' })
      await fetchStaff()
      toast.success('Staff member reactivated')
    } catch (err) {
      console.error('Error reactivating staff:', err)
      toast.error('Failed to reactivate staff')
      throw err
    }
  }

  // Get staff stats
  const getStaffStats = async (staffId) => {
    try {
      const sales = await db.sales.where('cashierId').equals(staffId).toArray()
      const completed = sales.filter(s => s.status === 'completed')
      const totalRevenue = completed.reduce((sum, s) => sum + s.totalAmount, 0)
      const voids = sales.filter(s => s.status === 'voided').length

      return {
        totalSales: completed.length,
        totalRevenue,
        voids,
      }
    } catch (err) {
      console.error('Error getting staff stats:', err)
      return { totalSales: 0, totalRevenue: 0, voids: 0 }
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  return {
    staff,
    loading,
    error,
    fetchStaff,
    addStaff,
    updateStaff,
    deactivateStaff,
    reactivateStaff,
    getStaffStats,
  }
}

export default useStaff
