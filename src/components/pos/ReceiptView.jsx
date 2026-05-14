import React, { useRef } from 'react'
import { Download, Printer, Home } from 'lucide-react'
import { Button } from '../ui/Button'
import { generateReceiptPDF, downloadReceiptPDF, printReceipt } from '../../utils/receipt'
import { formatCurrency, formatDateTime, generateReceiptNumber } from '../../utils/formatters'

export const ReceiptView = ({ receipt, pharmacyProfile, onNewSale }) => {
  const printRef = useRef()

  const handlePrint = async () => {
    await printReceipt(receipt, pharmacyProfile)
  }

  const handleDownload = async () => {
    await downloadReceiptPDF(receipt, pharmacyProfile)
  }

  const receiptNumber = generateReceiptNumber(receipt.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Receipt Content */}
        <div ref={printRef} className="p-8 space-y-6 text-sm font-dm-mono">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-lg font-bold">
              <span className="font-medium">Pharmacy</span>
              <span className="text-teal-700">OS</span>
            </div>
            <p className="text-xs text-slate-600">{pharmacyProfile.address}</p>
            <p className="text-xs text-slate-600">{pharmacyProfile.phone}</p>
          </div>

          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Receipt Info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Receipt:</span>
              <span className="font-semibold">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(new Date(receipt.timestamp))}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{receipt.cashierName}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Items */}
          <div className="space-y-2">
            <table className="w-full text-xs">
              <tbody>
                {receipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-left py-1">{item.drugName}</td>
                    <td className="text-center">x{item.qty}</td>
                    <td className="text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Payment:</span>
              <span className="capitalize">
                {receipt.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}
              </span>
            </div>
            {receipt.paymentMethod === 'mpesa' && receipt.mpesaConfirmationCode && (
              <div className="flex justify-between text-xs">
                <span>Ref:</span>
                <span>{receipt.mpesaConfirmationCode}</span>
              </div>
            )}
          </div>

          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="font-semibold">Thank You!</p>
            <p className="text-xs text-slate-600">PharmacyOS</p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 p-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              PDF
            </button>
          </div>

          <Button
            onClick={onNewSale}
            size="full"
            className="flex items-center justify-center gap-2"
          >
            <Home size={16} />
            New Sale
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReceiptView
