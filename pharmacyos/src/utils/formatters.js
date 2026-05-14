import { format, parseISO } from 'date-fns'

/**
 * Format currency (KES by default)
 */
export const formatCurrency = (amount, currency = 'KES') => {
  const symbols = {
    KES: 'KES',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  const symbol = symbols[currency] || currency
  return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, HH:mm')
}

/**
 * Format date only
 */
export const formatDate = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

/**
 * Format time only
 */
export const formatTime = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

/**
 * Format phone number (Kenyan format)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 9) return `254${cleaned}`
  if (cleaned.length === 10) return `254${cleaned.substring(1)}`
  if (cleaned.length === 12 && cleaned.startsWith('254')) return cleaned
  return phone
}

/**
 * Validate M-Pesa phone number
 */
export const isValidMpesaPhone = (phone) => {
  const formatted = formatPhoneNumber(phone)
  return /^254[17]\d{8}$/.test(formatted)
}

/**
 * Format M-Pesa phone for display
 */
export const formatMpesaPhone = (phone) => {
  const formatted = formatPhoneNumber(phone)
  if (formatted.length === 12) {
    return `+${formatted.substring(0, 3)} ${formatted.substring(3, 6)} ${formatted.substring(6, 9)} ${formatted.substring(9)}`
  }
  return phone
}

/**
 * Format percentage
 */
export const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`
}

/**
 * Format large numbers with abbreviations (1.2K, 3.4M)
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, length = 50) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

/**
 * Generate receipt number from sale ID
 */
export const generateReceiptNumber = (saleId) => {
  return `RCP-${String(saleId).padStart(6, '0')}`
}

export default {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatTime,
  formatPhoneNumber,
  formatMpesaPhone,
  isValidMpesaPhone,
  formatPercent,
  formatNumber,
  truncateText,
  generateReceiptNumber,
}
