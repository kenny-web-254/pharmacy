import React, { useState, useEffect } from 'react'
import { UserPlus, UserCheck, UserX, Edit, Lock } from 'lucide-react'
import Header from '../layout/Header'
import PageWrapper from '../layout/PageWrapper'
import BottomNav from '../layout/BottomNav'
import { Button } from '../ui/Button'
import { Table } from '../ui/Table'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { useStaff } from '../../hooks/useStaff'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export const Staff = () => {
  const { user } = useAuth()
  const { staff, addStaff, updateStaff, deactivateStaff, reactivateStaff } = useStaff()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', role: 'cashier', pin: '' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [pinError, setPinError] = useState('')

  const isTrivialPin = (pin) => {
    const trivial = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0123', '1234', '2345', '3456', '4567', '5678', '6789']
    return trivial.includes(pin)
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.pin) {
      toast.error('Please fill in all fields')
      return
    }

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      setPinError('PIN must be exactly 4 digits')
      return
    }

    if (isTrivialPin(formData.pin)) {
      setPinError('This PIN is too simple. Please choose a more secure PIN.')
      return
    }

    try {
      await addStaff({
        ...formData,
        addedBy: user.name,
      })
      setShowForm(false)
      setFormData({ name: '', role: 'cashier', pin: '' })
      setPinError('')
    } catch (err) {
      console.error('Error adding staff:', err)
    }
  }

  const handleChangeStatus = (staffMember, newStatus) => {
    setConfirmAction({
      staffId: staffMember.id,
      action: newStatus === 'active' ? 'activate' : 'deactivate',
      staffName: staffMember.name,
    })
    setShowConfirmModal(true)
  }

  const confirmStatusChange = async () => {
    try {
      if (confirmAction.action === 'deactivate') {
        await deactivateStaff(confirmAction.staffId)
      } else {
        await reactivateStaff(confirmAction.staffId)
      }
      setShowConfirmModal(false)
      setConfirmAction(null)
    } catch (err) {
      console.error('Error changing staff status:', err)
    }
  }

  const columns = [
    { key: 'name', label: 'Name', width: '200px' },
    {
      key: 'role',
      label: 'Role',
      render: (val) => <Badge variant={val === 'admin' ? 'primary' : 'secondary'}>{val.toUpperCase()}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge variant={val === 'active' ? 'success' : 'danger'}>{val.toUpperCase()}</Badge>,
    },
    { key: 'dateAdded', label: 'Date Added', render: (val) => formatDate(val) },
    { key: 'lastLogin', label: 'Last Login', render: (val) => val ? formatDate(val) : 'Never' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'active' ? (
            <button
              onClick={() => handleChangeStatus(row, 'inactive')}
              className="p-1 hover:bg-red-100 rounded"
            >
              <UserX size={16} className="text-red-600" />
            </button>
          ) : (
            <button
              onClick={() => handleChangeStatus(row, 'active')}
              className="p-1 hover:bg-green-100 rounded"
            >
              <UserCheck size={16} className="text-green-600" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageWrapper>
      <Header title="Staff Management" />

      <div className="p-4 md:p-6 space-y-4 md:ml-64 min-h-screen">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Staff Members</h2>
          <Button onClick={() => setShowForm(true)}>
            <UserPlus size={18} className="inline mr-1" />
            Add Staff
          </Button>
        </div>

        <Table columns={columns} data={staff} />
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setFormData({ name: '', role: 'cashier', pin: '' })
          setPinError('')
        }}
        title="Add Staff Member"
        size="md"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <Input
            label="Name*"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <Select
            label="Role"
            options={[
              { label: 'Cashier', value: 'cashier' },
              { label: 'Admin', value: 'admin' },
            ]}
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          />
          {formData.role === 'admin' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
              Admin role has full system access. Use with caution.
            </div>
          )}

          <Input
            label="PIN (4 digits)*"
            type="text"
            maxLength="4"
            placeholder="0000"
            value={formData.pin}
            onChange={(e) => {
              setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})
              setPinError('')
            }}
            error={pinError}
            required
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                setFormData({ name: '', role: 'cashier', pin: '' })
                setPinError('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Staff
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setConfirmAction(null)
        }}
        title="Confirm Action"
        size="sm"
      >
        {confirmAction && (
          <div className="space-y-4">
            <p className="text-slate-900">
              Are you sure you want to <strong>{confirmAction.action}</strong> <strong>{confirmAction.staffName}</strong>?
            </p>
            {confirmAction.action === 'deactivate' && (
              <p className="text-sm text-slate-600">
                Deactivated staff will not be able to log in, but their historical data will remain.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmAction(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant={confirmAction.action === 'deactivate' ? 'danger' : 'success'}
                onClick={confirmStatusChange}
              >
                {confirmAction.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <BottomNav />
    </PageWrapper>
  )
}

export default Staff
