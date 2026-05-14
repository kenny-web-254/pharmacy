/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  let csv = headers.join(',') + '\n'

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"` 
      }
      return value || ''
    })
    csv += values.join(',') + '\n'
  })

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export data to JSON
 */
export const exportToJSON = (data, filename = 'export.json') => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Import JSON data
 */
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

export default {
  exportToCSV,
  exportToJSON,
  importFromJSON,
}
