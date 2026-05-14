import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export const MpesaWaitingScreen = ({ onCancel }) => {
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onCancel()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onCancel])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <Clock
              size={64}
              className="text-teal-700 animate-spin"
              style={{ animation: 'spin 2s linear infinite' }}
            />
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Waiting for Payment...
        </h2>

        <p className="text-slate-600">
          A prompt has been sent to your phone. Please enter your M-Pesa PIN to complete the transaction.
        </p>

        {/* Countdown */}
        <div className="bg-slate-100 rounded-lg py-4">
          <p className="text-sm text-slate-600 mb-2">Time remaining:</p>
          <p className="text-4xl font-bold text-teal-700">
            {countdown}s
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          Do not close this window. Payment request will timeout in {countdown} seconds.
        </div>

        <button
          onClick={onCancel}
          className="w-full py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-medium transition-colors"
        >
          Cancel Request
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default MpesaWaitingScreen
