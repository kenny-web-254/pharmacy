import express from 'express'
import axios from 'axios'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// In-memory store for payment statuses (in production, use Redis or database)
const paymentStatuses = new Map()

// Rate limiter for STK push
const stkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many STK push requests, please try again later',
})

// Get OAuth token from Daraja
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')

    const response = await axios.get(
      `https://${process.env.MPESA_ENVIRONMENT === 'production' 
        ? 'api.safaricom.co.ke' 
        : 'sandbox.safaricom.co.ke'}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw new Error('Failed to get access token')
  }
}

// Trigger STK Push
router.post('/stkpush', stkLimiter, async (req, res) => {
  try {
    const { phone, amount, receiptRef } = req.body

    // Validate inputs
    if (!phone || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid phone or amount' })
    }

    // Get access token
    const token = await getAccessToken()

    // Prepare timestamp and password
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, -3)
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    // Make STK push request
    const apiUrl = process.env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    const response = await axios.post(
      apiUrl,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Phone: phone,
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: receiptRef,
        TransactionDesc: 'Pharmacy Payment',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // Store the request ID for status polling
    const checkoutRequestId = response.data.CheckoutRequestID
    paymentStatuses.set(checkoutRequestId, {
      status: 'pending',
      amount,
      phone,
      receiptRef,
      createdAt: Date.now(),
    })

    // Clean up old entries after 2 minutes
    setTimeout(() => {
      if (paymentStatuses.has(checkoutRequestId)) {
        paymentStatuses.delete(checkoutRequestId)
      }
    }, 2 * 60 * 1000)

    res.json({
      success: true,
      checkoutRequestId,
      message: 'STK push sent successfully',
    })
  } catch (error) {
    console.error('STK Push error:', error)
    res.status(500).json({
      error: error.message || 'Failed to process STK push',
    })
  }
})

// Callback endpoint (receives payment results from Daraja)
router.post('/callback', (req, res) => {
  try {
    const { Body } = req.body

    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ error: 'Invalid callback' })
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback

    // Update payment status
    if (paymentStatuses.has(CheckoutRequestID)) {
      if (ResultCode === 0) {
        // Payment successful
        let confirmationCode = ''
        if (CallbackMetadata && CallbackMetadata.Item) {
          const mpesaReceiptItem = CallbackMetadata.Item.find(
            item => item.Name === 'MpesaReceiptNumber'
          )
          confirmationCode = mpesaReceiptItem?.Value || ''
        }

        paymentStatuses.set(CheckoutRequestID, {
          status: 'confirmed',
          confirmationCode,
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          completedAt: Date.now(),
        })
      } else {
        // Payment failed
        paymentStatuses.set(CheckoutRequestID, {
          status: 'failed',
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          failedAt: Date.now(),
        })
      }
    }

    // Daraja requires 200 response quickly
    res.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    })
  } catch (error) {
    console.error('Callback error:', error)
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Error' })
  }
})

// Check payment status
router.get('/status/:checkoutRequestId', (req, res) => {
  try {
    const { checkoutRequestId } = req.params

    if (!paymentStatuses.has(checkoutRequestId)) {
      return res.json({
        status: 'pending',
        message: 'Payment request not found or expired',
      })
    }

    const paymentData = paymentStatuses.get(checkoutRequestId)

    res.json({
      status: paymentData.status,
      confirmationCode: paymentData.confirmationCode || '',
      resultCode: paymentData.resultCode || '',
      resultDesc: paymentData.resultDesc || '',
    })
  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({
      error: error.message || 'Failed to check status',
    })
  }
})

// Query payment status from Daraja (advanced)
router.post('/query', async (req, res) => {
  try {
    const { checkoutRequestId } = req.body

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'checkoutRequestId required' })
    }

    const token = await getAccessToken()

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, -3)
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')

    const apiUrl = process.env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'

    const response = await axios.post(
      apiUrl,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Query error:', error)
    res.status(500).json({
      error: error.message || 'Failed to query payment status',
    })
  }
})

export default router
