import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { loginUser, getLockoutTime } from '../../utils/auth'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'

export const Login = () => {
  const navigate = useNavigate()
  const { setUserSession } = useAuth()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const [lockoutCountdown, setLockoutCountdown] = useState(0)

  // Check for lockout on name change
  useEffect(() => {
    if (name) {
      const lockoutInfo = getLockoutTime(name)
      if (lockoutInfo) {
        setLocked(true)
        setLockoutCountdown(lockoutInfo.remainingSeconds)
      } else {
        setLocked(false)
      }
    }
  }, [name])

  // Countdown timer
  useEffect(() => {
    if (!locked) return

    const interval = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          setLocked(false)
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [locked])

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin(pin + digit)
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await loginUser(name, pin)

      if (result.success) {
        setUserSession(result.user)
        toast.success('Login successful!')
        
        // If force password change needed, redirect to settings
        if (result.user.forcePasswordChange) {
          navigate('/settings?changePIN=true')
        } else {
          navigate(result.user.role === 'admin' ? '/dashboard' : '/pos')
        }
      } else {
        if (result.locked) {
          setLocked(true)
          setLockoutCountdown(result.remainingSeconds)
          setError(result.error)
        } else {
          setError(result.error)
        }
        setPin('')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-700 rounded-full mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-3xl font-medium text-white">Pharmacy</span>
            <span className="text-3xl font-bold text-teal-500">OS</span>
          </div>
          <p className="text-slate-400 text-sm">Pharmacy Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <Input
              label="Name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              disabled={loading || locked}
            />

            {/* PIN Display */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                PIN (4 digits)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-center text-2xl tracking-widest font-dm-mono bg-slate-50 cursor-default"
                  placeholder="••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
                {locked && (
                  <p className="text-xs text-red-600 mt-1">
                    Try again in {lockoutCountdown}s
                  </p>
                )}
              </div>
            )}

            {/* PIN Pad */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              {digits.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-3 gap-2">
                  {row.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => digit !== '*' && digit !== '#' && handlePinInput(digit)}
                      disabled={loading || locked || pin.length >= 4}
                      className={`py-3 rounded-lg font-semibold text-lg transition-colors
                        ${digit === '*' || digit === '#'
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-white border-2 border-slate-300 hover:border-teal-500 active:bg-teal-50 disabled:opacity-50'
                        }`}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              ))}

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={loading || locked || pin.length === 0}
                  className="py-2 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 transition-colors text-sm"
                >
                  Backspace
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading || locked || pin.length === 0}
                  className="py-2 rounded-lg font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              size="full"
              disabled={loading || locked || pin.length < 4}
              className={loading ? 'opacity-75 cursor-not-allowed' : ''}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Info */}
          <div className="text-center text-xs text-slate-500">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Name: Admin</p>
            <p>PIN: 0000</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            PharmacyOS &copy; 2024 • All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
