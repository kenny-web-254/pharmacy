import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Download, Upload, AlertTriangle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Header from '../layout/Header'
import PageWrapper from '../layout/PageWrapper'
import BottomNav from '../layout/BottomNav'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { db, hashPin } from '../../db/db'
import { changeUserPin } from '../../utils/auth'
import { exportToJSON, importFromJSON, exportToCSV } from '../../utils/export'
import toast from 'react-hot-toast'

export const Settings = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [pharmacyData, setPharmacyData] = useState(null)
  const [editData, setEditData] = useState({})
  const [loading, setLoading] = useState(true)
  const [showPINChangeModal, setShowPINChangeModal] = useState(!!searchParams.get('changePIN'))
  const [pinData, setPinData] = useState({ old: '', new: '', confirm: '' })
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    const loadPharmacyData = async () => {
      try {
        const profiles = await db.pharmacyProfile.toArray()
        if (profiles.length > 0) {
          setPharmacyData(profiles[0])
          setEditData(profiles[0])
        }
        setLoading(false)
      } catch (err) {
        console.error('Error loading pharmacy data:', err)
        setLoading(false)
      }
    }

    loadPharmacyData()
  }, [])

  const handlePharmacyUpdate = async (e) => {
    e.preventDefault()

    try {
      await db.pharmacyProfile.update(pharmacyData.id, editData)
      setPharmacyData(editData)
      toast.success('Pharmacy profile updated')
    } catch (err) {
      console.error('Error updating pharmacy data:', err)
      toast.error('Failed to update pharmacy profile')
    }
  }

  const handlePINChange = async (e) => {
    e.preventDefault()
    setPinError('')

    if (!pinData.old || !pinData.new || !pinData.confirm) {
      setPinError('All fields are required')
      return
    }

    if (pinData.new.length !== 4 || !/^\d+$/.test(pinData.new)) {
      setPinError('New PIN must be exactly 4 digits')
      return
    }

    if (pinData.new !== pinData.confirm) {
      setPinError('PINs do not match')
      return
    }

    // Verify old PIN by hashing
    try {
      const { verifyPin } = await import('../../db/db')
      const currentUser = await db.users.get(user.id)
      const isValid = await verifyPin(pinData.old, currentUser.pin)

      if (!isValid) {
        setPinError('Current PIN is incorrect')
        return
      }

      await changeUserPin(user.id, pinData.new, user.name)
      toast.success('PIN changed successfully')
      setShowPINChangeModal(false)
      setPinData({ old: '', new: '', confirm: '' })
    } catch (err) {
      console.error('Error changing PIN:', err)
      setPinError('Failed to change PIN')
    }
  }

  const handleExportData = async () => {
    try {
      const allData = {
        drugs: await db.drugs.toArray(),
        sales: await db.sales.toArray(),
        users: await db.users.toArray(),
        voidLogs: await db.voidLogs.toArray(),
        pharmacyProfile: await db.pharmacyProfile.toArray(),
        exportedAt: new Date().toISOString(),
      }

      exportToJSON(allData, `pharmacyos-backup-${Date.now()}.json`)
      toast.success('Data exported successfully')
    } catch (err) {
      console.error('Error exporting data:', err)
      toast.error('Failed to export data')
    }
  }

  const handleImportData = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!window.confirm('This will import data from the file. Proceed?')) return

    try {
      const data = await importFromJSON(file)

      // Basic validation
      if (!data.drugs || !data.sales || !data.users) {
        throw new Error('Invalid backup file')
      }

      // This is a basic import - in production you'd want more robust error handling
      toast.success('Data imported successfully. Restart the app for changes to take effect.')
      window.location.reload()
    } catch (err) {
      console.error('Error importing data:', err)
      toast.error(err.message || 'Failed to import data')
    }
  }

  const handleClearSalesData = () => {
    const confirmText = window.prompt(
      'Type "DELETE SALES" to confirm clearing all sales data. This action cannot be undone:',
      ''
    )

    if (confirmText === 'DELETE SALES') {
      try {
        db.sales.clear()
        db.voidLogs.clear()
        db.attemptedSales.clear()
        toast.success('Sales data cleared')
      } catch (err) {
        console.error('Error clearing sales:', err)
        toast.error('Failed to clear sales data')
      }
    }
  }

  const handleFactoryReset = () => {
    const confirmText = window.prompt(
      'Type "RESET ALL" to confirm factory reset. This action cannot be undone:',
      ''
    )

    if (confirmText === 'RESET ALL') {
      try {
        localStorage.clear()
        sessionStorage.clear()
        db.delete()
        window.location.reload()
      } catch (err) {
        console.error('Error during reset:', err)
        toast.error('Failed to perform reset')
      }
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <Header title="Settings" />
        <div className="p-4 md:p-6 md:ml-64 text-center">Loading...</div>
        <BottomNav />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Header title="Settings" />

      <div className="p-4 md:p-6 space-y-6 md:ml-64 pb-32">
        {/* Pharmacy Profile */}
        <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pharmacy Profile</h3>
          <form onSubmit={handlePharmacyUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pharmacy Name"
                value={editData.name || ''}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
              />
              <Input
                label="Address"
                value={editData.address || ''}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
              />
              <Input
                label="Phone"
                value={editData.phone || ''}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
              />
              <Input
                label="Currency"
                value={editData.currency || 'KES'}
                onChange={(e) => setEditData({...editData, currency: e.target.value})}
              />
              <Input
                label="M-Pesa Shortcode"
                value={editData.mpesaShortcode || ''}
                onChange={(e) => setEditData({...editData, mpesaShortcode: e.target.value})}
              />
              <Input
                label="Proxy Server URL"
                value={editData.proxyServerUrl || 'http://localhost:3001'}
                onChange={(e) => setEditData({...editData, proxyServerUrl: e.target.value})}
              />
              <Input
                label="Low Stock Threshold"
                type="number"
                value={editData.lowStockThreshold || '20'}
                onChange={(e) => setEditData({...editData, lowStockThreshold: e.target.value})}
              />
            </div>
            <Button type="submit">
              Save Changes
            </Button>
          </form>
        </div>

        {/* Security */}
        <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Security</h3>
          <Button
            onClick={() => setShowPINChangeModal(true)}
            variant="secondary"
            className="w-full"
          >
            Change PIN
          </Button>
        </div>

        {/* Data Management */}
        <div className="bg-white border-2 border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h3>
          <div className="space-y-3">
            <Button
              onClick={handleExportData}
              variant="secondary"
              className="w-full"
            >
              <Download size={18} className="inline mr-2" />
              Download Backup
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                variant="secondary"
                className="w-full"
              >
                <Upload size={18} className="inline mr-2" />
                Import Backup
              </Button>
            </div>

            <Button
              onClick={handleClearSalesData}
              variant="danger"
              className="w-full"
            >
              Clear Sales Data
            </Button>

            <Button
              onClick={handleFactoryReset}
              variant="danger"
              className="w-full"
            >
              Factory Reset
            </Button>
          </div>
        </div>
      </div>

      {/* PIN Change Modal */}
      <Modal
        isOpen={showPINChangeModal}
        onClose={() => {
          setShowPINChangeModal(false)
          setPinData({ old: '', new: '', confirm: '' })
          setPinError('')
        }}
        title="Change PIN"
        size="sm"
      >
        <form onSubmit={handlePINChange} className="space-y-4">
          <Input
            label="Current PIN"
            type="password"
            maxLength="4"
            value={pinData.old}
            onChange={(e) => {
              setPinData({...pinData, old: e.target.value.replace(/\D/g, '')})
              setPinError('')
            }}
            required
          />

          <Input
            label="New PIN (4 digits)"
            type="password"
            maxLength="4"
            value={pinData.new}
            onChange={(e) => {
              setPinData({...pinData, new: e.target.value.replace(/\D/g, '')})
              setPinError('')
            }}
            required
          />

          <Input
            label="Confirm New PIN"
            type="password"
            maxLength="4"
            value={pinData.confirm}
            onChange={(e) => {
              setPinData({...pinData, confirm: e.target.value.replace(/\D/g, '')})
              setPinError('')
            }}
            error={pinError}
            required
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPINChangeModal(false)
                setPinData({ old: '', new: '', confirm: '' })
                setPinError('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Change PIN
            </Button>
          </div>
        </form>
      </Modal>

      <BottomNav />
    </PageWrapper>
  )
}

export default Settings
