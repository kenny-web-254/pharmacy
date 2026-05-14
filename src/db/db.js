import Dexie from 'dexie'

export const db = new Dexie('PharmacyOS')

db.version(1).stores({
  drugs: '++id',
  sales: '++id, timestamp',
  users: '++id',
  pinChangeLogs: '++id, userId',
  voidLogs: '++id, saleId, voidedAt',
  attemptedSales: '++id, timestamp',
  pharmacyProfile: '++id',
})

export const initializeDatabase = async () => {
  try {
    // Check if default admin exists
    const adminExists = await db.users.where('role').equals('admin').count()
    
    if (adminExists === 0) {
      // Create default admin account with PIN "0000"
      const hashedPin = await hashPin('0000')
      const now = new Date()
      
      await db.users.add({
        name: 'Admin',
        role: 'admin',
        pin: hashedPin,
        status: 'active',
        dateAdded: now,
        lastLogin: null,
        addedBy: 'SYSTEM',
        forcePasswordChange: true, // Flag for first login
      })

      // Create default pharmacy profile
      await db.pharmacyProfile.add({
        name: 'PharmacyOS',
        address: '123 Main Street',
        phone: '+254700000000',
        email: 'admin@pharmacyos.local',
        currency: 'KES',
        currencySymbol: 'KES',
        mpesaShortcode: '174379',
        proxyServerUrl: 'http://localhost:3001',
        lowStockThreshold: 20,
        createdAt: now,
        updatedAt: now,
      })
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

/**
 * Hash a PIN using SHA-256 (in-browser)
 * Note: For production, ensure crypto-js or similar is available
 */
export const hashPin = async (pin) => {
  // Using a simple hash approach - in production use crypto library
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Verify a PIN against its hash
 */
export const verifyPin = async (pin, hash) => {
  const pinHash = await hashPin(pin)
  return pinHash === hash
}

export default db
