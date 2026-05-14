import { db } from '../db/db'
import { formatCurrency, formatDate, formatTime, generateReceiptNumber } from './formatters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generate PDF receipt
 */
export const generateReceiptPDF = async (sale, pharmacyProfile) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - 2 * margin

  let yPosition = margin

  // Set fonts
  const titleFont = ['DM Sans', 'Arial']
  const normalFont = ['DM Mono', 'Courier']

  // Header - PharmacyOS name with formatting
  doc.setFont(...titleFont)
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110) // Teal color

  // Draw "Pharmacy" + "OS" with OS bold
  doc.text('Pharmacy', margin, yPosition)
  const pharmacyWidth = doc.getTextWidth('Pharmacy')
  
  doc.setFont(...titleFont)
  doc.setFontSize(14)
  doc.setTextColor(15, 118, 110)
  doc.text('OS', margin + pharmacyWidth + 2, yPosition)
  
  yPosition += 8

  // Pharmacy details
  doc.setFont(...normalFont)
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  
  doc.text(pharmacyProfile.address || '123 Main Street', margin, yPosition)
  yPosition += 4
  doc.text(pharmacyProfile.phone || '+254700000000', margin, yPosition)
  yPosition += 4
  doc.text(pharmacyProfile.email || 'admin@pharmacyos.local', margin, yPosition)
  yPosition += 6

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 4

  // Receipt info
  doc.setFont(...normalFont)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)

  const receiptNumber = generateReceiptNumber(sale.id)
  doc.text(`Receipt: ${receiptNumber}`, margin, yPosition)
  yPosition += 4

  const saleDate = new Date(sale.timestamp)
  doc.text(`Date: ${formatDate(saleDate)}`, margin, yPosition)
  yPosition += 4
  doc.text(`Time: ${formatTime(saleDate)}`, margin, yPosition)
  yPosition += 4
  doc.text(`Cashier: ${sale.cashierName}`, margin, yPosition)
  yPosition += 6

  // Items table
  const itemsData = sale.items.map(item => [
    item.drugName,
    item.qty.toString(),
    formatCurrency(item.unitPrice).substring(4), // Remove currency prefix
    formatCurrency(item.subtotal).substring(4),
  ])

  autoTable(doc, {
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: itemsData,
    startY: yPosition,
    margin: margin,
    theme: 'plain',
    lineColor: [200, 200, 200],
    headStyles: {
      fontSize: 8,
      fontStyle: 'bold',
      textColor: [15, 118, 110],
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
      lineWidth: 0.3,
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  })

  yPosition = doc.lastAutoTable.finalY + 4

  // Summary separator
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 4

  // Totals
  doc.setFont(...titleFont)
  doc.setFontSize(10)
  doc.setTextColor(15, 118, 110)

  doc.text('Total:', pageWidth - margin - doc.getTextWidth(formatCurrency(sale.totalAmount)), yPosition)
  doc.text(formatCurrency(sale.totalAmount), pageWidth - margin, yPosition, { align: 'right' })
  yPosition += 6

  // Payment method
  doc.setFont(...normalFont)
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)

  const paymentText = sale.paymentMethod === 'mpesa'
    ? `Payment: M-Pesa`
    : `Payment: Cash`

  doc.text(paymentText, margin, yPosition)
  yPosition += 4

  if (sale.paymentMethod === 'mpesa' && sale.mpesaConfirmationCode) {
    doc.text(`Ref: ${sale.mpesaConfirmationCode}`, margin, yPosition)
    yPosition += 4
  }

  // Footer
  doc.setFont(...normalFont)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Thank you for your purchase!', pageWidth / 2, pageHeight - margin, { align: 'center' })
  doc.text('PharmacyOS - Pharmacy Management System', pageWidth / 2, pageHeight - margin + 3, { align: 'center' })

  return doc
}

/**
 * Print receipt
 */
export const printReceipt = async (sale, pharmacyProfile) => {
  const doc = await generateReceiptPDF(sale, pharmacyProfile)
  window.open(doc.output('bloburi'), '_blank')
}

/**
 * Download receipt as PDF
 */
export const downloadReceiptPDF = async (sale, pharmacyProfile) => {
  const doc = await generateReceiptPDF(sale, pharmacyProfile)
  const receiptNumber = generateReceiptNumber(sale.id)
  doc.save(`Receipt-${receiptNumber}.pdf`)
}

export default {
  generateReceiptPDF,
  printReceipt,
  downloadReceiptPDF,
}
