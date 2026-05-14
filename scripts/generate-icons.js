#!/usr/bin/env node

/**
 * Generate PWA Icons
 * Creates placeholder SVG icons for PWA manifest
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const createIconSVG = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#0f766e"/>
  
  <!-- Pill/Capsule shape -->
  <path d="M ${size * 0.3} ${size * 0.35} L ${size * 0.7} ${size * 0.35} Q ${size * 0.75} ${size * 0.35} ${size * 0.75} ${size * 0.5} L ${size * 0.75} ${size * 0.65} Q ${size * 0.75} ${size * 0.7} ${size * 0.7} ${size * 0.7} L ${size * 0.3} ${size * 0.7} Q ${size * 0.25} ${size * 0.7} ${size * 0.25} ${size * 0.65} L ${size * 0.25} ${size * 0.5} Q ${size * 0.25} ${size * 0.35} ${size * 0.3} ${size * 0.35} Z" fill="#ffffff"/>
  
  <!-- Cross for medicine -->
  <rect x="${size * 0.45}" y="${size * 0.3}" width="${size * 0.1}" height="${size * 0.4}" fill="#10b981"/>
  <rect x="${size * 0.3}" y="${size * 0.45}" width="${size * 0.4}" height="${size * 0.1}" fill="#10b981"/>
</svg>`
}

const publicDir = path.join(__dirname, 'public')

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Generate icons
const sizes = [192, 512]

sizes.forEach(size => {
  // Regular icon
  const iconPath = path.join(publicDir, `icon-${size}.png`)
  const svg = createIconSVG(size)
  
  // Write SVG version
  fs.writeFileSync(
    path.join(publicDir, `icon-${size}.svg`),
    svg
  )
  
  console.log(`Generated icon-${size}.svg`)
})

console.log('PWA icons generated successfully!')
console.log('Note: PNG versions should be generated using an SVG-to-PNG converter')
console.log('Consider using tools like: sharp, imagemin-svgo, or online converters')
