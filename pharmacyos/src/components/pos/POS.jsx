import React, { useState, useEffect } from 'react'
import { Search, Trash2, Plus, Minus, CreditCard, Wallet } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import toast from 'react-hot-toast'
import { db } from '../../db/db'
import { useInventory } from '../../hooks/useInventory'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, formatPhoneNumber, isValidMpesaPhone } from '../../utils/formatters'
import { triggerStkPush, pollPaymentStatus, logFailedMpesaAttempt } from '../../utils/mpesa'
import MpesaWaitingScreen from './MpesaWaitingScreen'
import ReceiptView from './ReceiptView'

export const POS = () => {
  const { user } = useAuth()
  const { drugs, searchDrugs } = useInventory()
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaPhoneError, setMpesaPhoneError] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [mpesaWaiting, setMpesaWaiting] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [pharmacyProfile, setPharmacyProfile] = useState(null)

  // Fetch pharmacy profile
  useEffect(() => {
    const fetchPharmacyProfile = async () => {
      try {
        const profile = await db.pharmacyProfile.toArray()
        if (profile.length > 0) {
          setPharmacyProfile(profile[0])
        }
      } catch (err) {
        console.error('Error fetching pharmacy profile:', err)
      }
    }
    fetchPharmacyProfile()
  }, [])

  // Add item to cart
  const addToCart = (drug) => {
    if (drug.quantity === 0) {
      toast.error('Out of stock')
      return
    }

    const existingItem = cart.find(item => item.drugId === drug.id)
    
    if (existingItem) {
      if (existingItem.qty >= drug.quantity) {
        toast.error('Insufficient stock')
        return
      }
      updateCartQuantity(drug.id, existingItem.qty + 1)
    } else {
      setCart([
        ...cart,
        {
          drugId: drug.id,
          drugName: drug.name,
          qty: 1,
          unitPrice: drug.sellingPrice,
          availableStock: drug.quantity,
        },
      ])
      toast.success(`${drug.name} added to cart`)
    }
  }

  // Update cart quantity
  const updateCartQuantity = (drugId, newQty) => {
    const item = cart.find(i => i.drugId === drugId)
    if (newQty <= 0) {
      removeFromCart(drugId)
      return
    }
    if (newQty > item.availableStock) {
      toast.error('Insufficient stock')
      return
    }
    setCart(cart.map(item =>
      item.drugId === drugId
        ? { ...item, qty: newQty }
        : item
    ))
  }

  // Remove from cart
  const removeFromCart = (drugId) => {
    setCart(cart.filter(item => item.drugId !== drugId))
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0)
    return {
      subtotal,
      total: subtotal,
      itemCount: cart.length,
      units: cart.reduce((sum, item) => sum + item.qty, 0),
    }
  }

  const totals = calculateTotals()

  // Handle cash payment
  const handleCashPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    setProcessingPayment(true)
    try {
      // Create sale record
      const sale = {
        timestamp: new Date(),
        cashierName: user.name,
        cashierId: user.id,
        items: cart.map(item => ({
          drugId: item.drugId,
          drugName: item.drugName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: item.qty * item.unitPrice,
        })),
        totalAmount: totals.total,
        paymentMethod: 'cash',
        status: 'completed',
      }

      const saleId = await db.sales.add(sale)

      // Update stock
      for (const item of cart) {
        const drug = await db.drugs.get(item.drugId)
        await db.drugs.update(item.drugId, {
          quantity: drug.quantity - item.qty,
        })
      }

      // Get sale for receipt
      const saleRecord = await db.sales.get(saleId)
      setReceipt({ ...saleRecord, id: saleId })
      setShowReceipt(true)

      // Clear cart and close modal
      setCart([])
      setShowPaymentModal(false)

      toast.success('Sale completed successfully')
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Failed to process payment')
    } finally {
      setProcessingPayment(false)
    }
  }

  // Handle M-Pesa payment
  const handleMpesaPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    // Validate phone number
    if (!isValidMpesaPhone(mpesaPhone)) {
      setMpesaPhoneError('Invalid phone number (use 0712345678 or 254712345678)')
      return
    }

    setMpesaPhoneError('')
    setProcessingPayment(true)

    try {
      if (!pharmacyProfile) {
        throw new Error('Pharmacy profile not configured')
      }

      const formattedPhone = formatPhoneNumber(mpesaPhone)
      const receiptRef = `RCP-${Date.now()}`

      // Trigger STK Push
      const stkResponse = await triggerStkPush(
        formattedPhone,
        totals.total,
        receiptRef,
        pharmacyProfile.proxyServerUrl || 'http://localhost:3001'
      )

      if (!stkResponse.success) {
        throw new Error(stkResponse.error)
      }

      // Show waiting screen
      setCheckoutRequestId(stkResponse.checkoutRequestId)
      setMpesaWaiting(true)

      // Poll for payment status
      const statusResponse = await pollPaymentStatus(
        stkResponse.checkoutRequestId,
        pharmacyProfile.proxyServerUrl || 'http://localhost:3001'
      )

      if (statusResponse.success && statusResponse.status === 'confirmed') {
        // Create sale record
        const sale = {
          timestamp: new Date(),
          cashierName: user.name,
          cashierId: user.id,
          items: cart.map(item => ({
            drugId: item.drugId,
            drugName: item.drugName,
            qty: item.qty,
            unitPrice: item.unitPrice,
            subtotal: item.qty * item.unitPrice,
          })),
          totalAmount: totals.total,
          paymentMethod: 'mpesa',
          mpesaPhone: formattedPhone,
          mpesaConfirmationCode: statusResponse.confirmationCode,
          mpesaStatus: 'confirmed',
          status: 'completed',
        }

        const saleId = await db.sales.add(sale)

        // Update stock
        for (const item of cart) {
          const drug = await db.drugs.get(item.drugId)
          await db.drugs.update(item.drugId, {
            quantity: drug.quantity - item.qty,
          })
        }

        // Get sale for receipt
        const saleRecord = await db.sales.get(saleId)
        setReceipt({ ...saleRecord, id: saleId })

        toast.success('Payment confirmed!')
        setShowReceipt(true)
        setCart([])
        setMpesaPhone('')
        setShowPaymentModal(false)
      } else {
        // Log failed attempt
        await logFailedMpesaAttempt(
          user,
          cart,
          totals.total,
          formattedPhone,
          statusResponse.error || 'Payment declined'
        )

        toast.error(statusResponse.error || 'Payment failed. Please try again.')
      }
    } catch (err) {
      console.error('M-Pesa error:', err)
      toast.error(err.message || 'Failed to process M-Pesa payment')
    } finally {
      setMpesaWaiting(false)
      setProcessingPayment(false)
      setCheckoutRequestId(null)
    }
  }

  const filteredDrugs = searchQuery ? searchDrugs(searchQuery) : drugs

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 md:p-6">
        {/* Drug Selection - Main area */}
        <div className="md:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search drugs by name or generic name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Available drugs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  drug.quantity === 0
                    ? 'border-slate-200 bg-slate-50 opacity-50'
                    : 'border-slate-300 hover:border-teal-500 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{drug.name}</h3>
                    <p className="text-xs text-slate-600">{drug.genericName}</p>
                  </div>
                  {drug.quantity <= drug.lowStockThreshold && drug.quantity > 0 && (
                    <Badge variant="warning" size="sm">Low</Badge>
                  )}
                  {drug.quantity === 0 && (
                    <Badge variant="danger" size="sm">Out</Badge>
                  )}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-teal-700">
                    {formatCurrency(drug.sellingPrice)}
                  </span>
                  <span className="text-sm text-slate-600">
                    Stock: {drug.quantity}
                  </span>
                </div>

                <Button
                  onClick={() => addToCart(drug)}
                  disabled={drug.quantity === 0}
                  variant={drug.quantity === 0 ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                >
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>

          {filteredDrugs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">No drugs found</p>
            </div>
          )}
        </div>

        {/* Cart Summary - Sidebar */}
        <div className="md:sticky md:top-4 md:h-fit space-y-4">
          <div className="bg-white border-2 border-slate-300 rounded-lg p-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Shopping Cart</h2>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.drugId} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm text-slate-900">
                        {item.drugName}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.drugId)}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600">
                        {formatCurrency(item.unitPrice)} x {item.qty}
                      </span>
                      <span className="font-semibold text-teal-700">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.drugId, item.qty - 1)}
                        className="p-1 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                        disabled={item.qty <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="flex-1 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.drugId, item.qty + 1)}
                        className="p-1 bg-slate-200 hover:bg-slate-300 rounded transition-colors"
                        disabled={item.qty >= item.availableStock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="border-t border-slate-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Items:</span>
                    <span className="font-medium">{totals.itemCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Units:</span>
                    <span className="font-medium">{totals.units}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                    <span>Total:</span>
                    <span className="text-teal-700">{formatCurrency(totals.total)}</span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 block">
                    Payment Method
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        paymentMethod === 'cash'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      <Wallet size={16} className="inline mr-1" />
                      Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                        paymentMethod === 'mpesa'
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      <CreditCard size={16} className="inline mr-1" />
                      M-Pesa
                    </button>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPaymentModal(true)}
                  size="full"
                  className="mt-4"
                >
                  Proceed to Payment
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* M-Pesa Waiting Screen */}
      {mpesaWaiting && (
        <MpesaWaitingScreen
          onCancel={() => {
            setMpesaWaiting(false)
            setCheckoutRequestId(null)
          }}
        />
      )}

      {/* Receipt */}
      {showReceipt && receipt && pharmacyProfile && (
        <ReceiptView
          receipt={receipt}
          pharmacyProfile={pharmacyProfile}
          onNewSale={() => {
            setShowReceipt(false)
            setReceipt(null)
          }}
        />
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => !processingPayment && setShowPaymentModal(false)}
        title={paymentMethod === 'cash' ? 'Cash Payment' : 'M-Pesa Payment'}
        size="md"
      >
        {paymentMethod === 'cash' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              Press "Confirm Payment" to complete the transaction and print receipt.
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-4">
              <span>Amount:</span>
              <span className="text-teal-700">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="M-Pesa Phone Number"
              type="tel"
              placeholder="e.g., 0712345678"
              value={mpesaPhone}
              onChange={(e) => {
                setMpesaPhone(e.target.value)
                setMpesaPhoneError('')
              }}
              error={mpesaPhoneError}
              disabled={processingPayment}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-4">
              <span>Amount:</span>
              <span className="text-teal-700">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowPaymentModal(false)}
            disabled={processingPayment}
          >
            Cancel
          </Button>
          <Button
            onClick={paymentMethod === 'cash' ? handleCashPayment : handleMpesaPayment}
            disabled={processingPayment}
          >
            {processingPayment ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default POS
