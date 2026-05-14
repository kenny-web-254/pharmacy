import { db, hashPin } from './db'

/**
 * Seed initial data (called only on first app launch)
 */
export const seedDatabase = async () => {
  // Check if data already exists
  const userCount = await db.users.count()
  if (userCount > 0) return

  const now = new Date()

  // Create sample drugs
  const sampleDrugs = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      category: 'Analgesic',
      manufacturer: 'MEDIC Pharma',
      unit: 'tablet',
      costPrice: 2.50,
      sellingPrice: 5.00,
      quantity: 500,
      lowStockThreshold: 50,
      expiryDate: new Date(2025, 11, 31),
      barcode: '7891234567890',
      description: '500mg tablets for pain relief',
      requiresPrescription: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin Trihydrate',
      category: 'Antibiotic',
      manufacturer: 'Global Pharma',
      unit: 'capsule',
      costPrice: 8.00,
      sellingPrice: 15.00,
      quantity: 200,
      lowStockThreshold: 50,
      expiryDate: new Date(2025, 5, 30),
      barcode: '7891234567891',
      description: '250mg capsules',
      requiresPrescription: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Ibuprofen',
      genericName: 'Ibuprofen',
      category: 'NSAID',
      manufacturer: 'Remedy Pharma',
      unit: 'tablet',
      costPrice: 3.00,
      sellingPrice: 6.50,
      quantity: 300,
      lowStockThreshold: 40,
      expiryDate: new Date(2025, 10, 31),
      barcode: '7891234567892',
      description: '200mg tablets for inflammation',
      requiresPrescription: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Metformin',
      genericName: 'Metformin HCl',
      category: 'Antidiabetic',
      manufacturer: 'Glucose Control Ltd',
      unit: 'tablet',
      costPrice: 4.50,
      sellingPrice: 9.00,
      quantity: 100,
      lowStockThreshold: 30,
      expiryDate: new Date(2025, 8, 15),
      barcode: '7891234567893',
      description: '500mg tablets for diabetes management',
      requiresPrescription: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Cetirizine',
      genericName: 'Cetirizine HCl',
      category: 'Antihistamine',
      manufacturer: 'Allergy Solutions',
      unit: 'tablet',
      costPrice: 3.50,
      sellingPrice: 7.00,
      quantity: 15,
      lowStockThreshold: 25,
      expiryDate: new Date(2025, 12, 31),
      barcode: '7891234567894',
      description: '10mg tablets for allergies',
      requiresPrescription: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      category: 'Vitamin',
      manufacturer: 'Wellness Plus',
      unit: 'capsule',
      costPrice: 5.00,
      sellingPrice: 10.00,
      quantity: 5,
      lowStockThreshold: 20,
      expiryDate: new Date(2026, 6, 30),
      barcode: '7891234567895',
      description: '1000 IU capsules',
      requiresPrescription: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // Insert sample drugs
  await db.drugs.bulkAdd(sampleDrugs)

  console.log('Database seeded successfully')
}

export default seedDatabase
