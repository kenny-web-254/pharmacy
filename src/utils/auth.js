import { db, verifyPin, hashPin } from '../db/db'

const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_FAILED_ATTEMPTS = 5
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SESSION_KEY = 'pharmacyos_session'
const LOCKOUT_KEY_PREFIX = 'pharmacyos_lockout_'

/**
 * Attempt user login
 */
export const loginUser = async (name, pin) => {
  try {
    // Check if user is currently locked out
    const lockoutKey = LOCKOUT_KEY_PREFIX + name
    const lockoutData = localStorage.getItem(lockoutKey)
    
    if (lockoutData) {
      const { lockedUntil, attempts } = JSON.parse(lockoutData)
      const now = Date.now()
      
      if (now < lockedUntil) {
        const remainingTime = Math.ceil((lockedUntil - now) / 1000)
        return {
          success: false,
          error: `Account locked. Try again in ${remainingTime} seconds.`,
          locked: true,
          remainingSeconds: remainingTime,
        }
      } else {
        // Lockout expired, clear it
        localStorage.removeItem(lockoutKey)
      }
    }

    // Find user by name
    const user = await db.users.where('name').equalsIgnoreCase(name).first()

    if (!user) {
      recordFailedAttempt(name)
      return { success: false, error: 'Invalid credentials' }
    }

    if (user.status !== 'active') {
      return { success: false, error: 'Account is inactive' }
    }

    // Verify PIN
    const pinValid = await verifyPin(pin, user.pin)

    if (!pinValid) {
      recordFailedAttempt(name)
      return { success: false, error: 'Invalid credentials' }
    }

    // Clear failed attempts
    localStorage.removeItem(lockoutKey)

    // Update last login
    await db.users.update(user.id, { lastLogin: new Date() })

    // Create session
    const session = {
      userId: user.id,
      name: user.name,
      role: user.role,
      startTime: Date.now(),
      forcePasswordChange: user.forcePasswordChange || false,
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange || false,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An error occurred during login' }
  }
}

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (name) => {
  const lockoutKey = LOCKOUT_KEY_PREFIX + name
  const lockoutData = localStorage.getItem(lockoutKey)
  
  let attempts = 1
  let lockedUntil = Date.now()

  if (lockoutData) {
    const data = JSON.parse(lockoutData)
    attempts = data.attempts + 1
    lockedUntil = data.lockedUntil
  }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_DURATION
  }

  localStorage.setItem(
    lockoutKey,
    JSON.stringify({ attempts, lockedUntil })
  )
}

/**
 * Get current session
 */
export const getSession = () => {
  const sessionData = sessionStorage.getItem(SESSION_KEY)
  
  if (!sessionData) {
    return null
  }

  const session = JSON.parse(sessionData)
  const now = Date.now()
  const elapsed = now - session.startTime

  // Check session timeout
  if (elapsed > SESSION_TIMEOUT) {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }

  return session
}

/**
 * Logout user
 */
export const logoutUser = () => {
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * Check if user needs to change PIN on first login
 */
export const checkForcePasswordChange = async (userId) => {
  const user = await db.users.get(userId)
  return user?.forcePasswordChange || false
}

/**
 * Change user PIN
 */
export const changeUserPin = async (userId, newPin, changedBy) => {
  try {
    // Validate new PIN is not trivial (0000, 1111, 1234, etc.)
    if (isTrivialPin(newPin)) {
      return { success: false, error: 'PIN is too simple. Choose a more secure PIN.' }
    }

    const hashedPin = await hashPin(newPin)

    await db.users.update(userId, {
      pin: hashedPin,
      forcePasswordChange: false,
    })

    // Log the PIN change
    await db.pinChangeLogs.add({
      userId,
      changedBy,
      changedAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error('PIN change error:', error)
    return { success: false, error: 'Failed to change PIN' }
  }
}

/**
 * Check if PIN is too trivial
 */
const isTrivialPin = (pin) => {
  const trivialPins = [
    '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999',
    '0123', '1234', '2345', '3456', '4567',
    '5678', '6789', '1357', '2468', '1000',
  ]
  return trivialPins.includes(pin)
}

/**
 * Get lock time for a user if currently locked
 */
export const getLockoutTime = (name) => {
  const lockoutKey = LOCKOUT_KEY_PREFIX + name
  const lockoutData = localStorage.getItem(lockoutKey)
  
  if (!lockoutData) return null

  const { lockedUntil } = JSON.parse(lockoutData)
  const now = Date.now()

  if (now >= lockedUntil) return null

  return {
    remainingSeconds: Math.ceil((lockedUntil - now) / 1000),
    lockedUntil,
  }
}

export default {
  loginUser,
  getSession,
  logoutUser,
  changeUserPin,
  checkForcePasswordChange,
}
