import axios from 'axios'
import { db } from '../db/db'

/**
 * Trigger M-Pesa STK Push
 */
export const triggerStkPush = async (phone, amount, receiptRef, proxyServerUrl) => {
  try {
    const response = await axios.post(`${proxyServerUrl}/api/mpesa/stkpush`, {
      phone,
      amount: Math.round(amount), // M-Pesa requires integer amount
      receiptRef,
    })

    return {
      success: true,
      checkoutRequestId: response.data.checkoutRequestId,
    }
  } catch (error) {
    console.error('STK Push error:', error)
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to trigger payment request',
    }
  }
}

/**
 * Poll M-Pesa payment status
 */
export const pollPaymentStatus = async (checkoutRequestId, proxyServerUrl, maxAttempts = 20) => {
  let attempts = 0
  
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      attempts++

      try {
        const response = await axios.get(`${proxyServerUrl}/api/mpesa/status/${checkoutRequestId}`)
        const { status, confirmationCode } = response.data

        if (status === 'confirmed') {
          clearInterval(interval)
          resolve({
            success: true,
            status: 'confirmed',
            confirmationCode,
          })
        } else if (status === 'failed') {
          clearInterval(interval)
          resolve({
            success: false,
            status: 'failed',
            error: 'Payment was declined',
          })
        }
      } catch (error) {
        console.error('Status poll error:', error)
      }

      // Timeout after 20 attempts (60 seconds with 3s interval)
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve({
          success: false,
          status: 'timeout',
          error: 'Payment request timed out. Please try again.',
        })
      }
    }, 3000) // Poll every 3 seconds
  })
}

/**
 * Log failed M-Pesa attempt
 */
export const logFailedMpesaAttempt = async (cash, items, totalAmount, phone, failReason) => {
  try {
    await db.attemptedSales.add({
      timestamp: new Date(),
      cashierName: cash.name,
      items,
      totalAmount,
      phone,
      failReason,
    })
  } catch (error) {
    console.error('Failed to log M-Pesa attempt:', error)
  }
}

export default {
  triggerStkPush,
  pollPaymentStatus,
  logFailedMpesaAttempt,
}
