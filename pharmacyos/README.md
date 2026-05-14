# PharmacyOS

A production-ready Progressive Web App (PWA) for managing pharmacy/chemist operations with offline-first support, M-Pesa integration, and comprehensive inventory, sales, and staff management.

## Features

### Core Functionality
- **Point of Sale (POS)**: Fast drug scanning, cart management, and payment processing
- **Inventory Management**: Real-time stock tracking, low-stock alerts, reordering, and expiry tracking
- **Sales Reports**: Comprehensive analytics, filtering by date/cashier/payment method, void transaction management
- **Staff Management**: User roles (admin/cashier), PIN-based authentication, activity tracking
- **Admin Dashboard**: Revenue charts, payment breakdowns, low-stock alerts, key metrics
- **Settings**: Pharmacy profile, backup/restore, data export, PIN management

### Technical Highlights
- **Offline-First**: 100% functional without internet using IndexedDB (Dexie.js)
- **Installable PWA**: Add to home screen on mobile and desktop
- **M-Pesa Integration**: Daraja API integration with STK push and callback handling
- **Security**: PIN hashing (SHA-256), session management, rate limiting, role-based access
- **Responsive Design**: Mobile-first, works on phones, tablets, and desktops
- **Receipt Generation**: PDF export and print with proper formatting
- **Audit Trail**: Void logs, PIN change history, sales records immutability

---

## Project Structure

```
pharmacyos/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable components (Button, Modal, Table, etc)
│   │   ├── layout/          # Layout components (Sidebar, Navigation)
│   │   ├── pos/             # POS-specific components
│   │   ├── inventory/       # Inventory components
│   │   ├── reports/         # Reports components
│   │   ├── staff/           # Staff management components
│   │   ├── dashboard/       # Dashboard components
│   │   └── settings/        # Settings components
│   ├── pages/               # Page components (routes)
│   ├── db/                  # Dexie.js database schema and utilities
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions (auth, formatters, exports)
│   ├── context/             # React context (Auth)
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── proxy-server/            # Express backend for M-Pesa
│   ├── routes/
│   │   └── mpesa.js         # M-Pesa endpoints
│   ├── middleware/
│   ├── server.js            # Express server
│   ├── package.json
│   └── .env.example
├── public/                  # Static files and PWA icons
├── index.html               # HTML template
├── package.json             # Frontend dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md
```

---

## Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm
- **M-Pesa Developer Account** (for Daraja API - get at [developer.safaricom.co.ke](https://developer.safaricom.co.ke))

### 1. Clone & Install

```bash
git clone <repo-url>
cd pharmacyos

# Install frontend dependencies
npm install

# Install proxy server dependencies
cd proxy-server
npm install
cd ..
```

### 2. Configure Environment Variables

**Frontend**: Create `.env` in the root directory (optional for development):
```
VITE_PROXY_URL=http://localhost:3001
```

**Backend**: Create `proxy-server/.env`:
```bash
# Copy from example
cp proxy-server/.env.example proxy-server/.env

# Edit with your credentials
nano proxy-server/.env
```

Fill in your Daraja API credentials:
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379  # Your business shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
MPESA_ENVIRONMENT=sandbox  # or 'production'
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

### 3. Generate PWA Icons

```bash
# Generate placeholder SVA icons
node scripts/generate-icons.js

# Convert SVG to PNG using your preferred tool:
# - Online: https://convertio.co/svg-png/
# - CLI: npx svgexport icon-192.svg icon-192.png
# Place PNG files in public/
```

### 4. Run Development Servers

**Terminal 1 - Frontend (Vite dev server):**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Backend (Proxy server):**
```bash
cd proxy-server
npm run dev
# Runs on http://localhost:3001
```

### 5. First Login

The app creates a default admin account on first launch:
- **Name**: Admin
- **PIN**: 0000

⚠️ **IMPORTANT**: Change the default PIN immediately in Settings → Security → Change PIN

---

## Usage Guide

### Admin Features

1. **Dashboard**: Real-time sales metrics, revenue charts, inventory value
2. **Inventory**: Add/edit drugs, restock, mark as discontinued, track expiry
3. **Sales Reports**: Filter sales by date/cashier/payment method, void transactions
4. **Staff Management**: Add users (cashier/admin), deactivate accounts
5. **Settings**: Pharmacy profile, backup data, PIN management

### Cashier Features

1. **POS Screen**: Search drugs → Add to cart → Choose payment → Complete sale
2. **Payment Methods**: Cash (instant) or M-Pesa (STK push)
3. **Receipt**: Print or download PDF

### M-Pesa Payment Flow

1. Enter customer's M-Pesa phone number
2. App sends STK push request to proxy server
3. Customer enters PIN on their phone
4. App polls status every 3 seconds
5. On success: Receipt generated, stock deducted, sale recorded
6. On failure: Sale cancelled, stock unchanged, attempt logged

---

## Database Schema

### drugs
```js
{
  id, name, genericName, category, manufacturer, unit,
  costPrice, sellingPrice, quantity, lowStockThreshold,
  expiryDate, barcode, description, requiresPrescription,
  createdAt, updatedAt
}
```

### sales
```js
{
  id, timestamp, cashierName, cashierId,
  items: [{drugId, drugName, qty, unitPrice, subtotal}],
  totalAmount, paymentMethod, mpesaPhone, mpesaConfirmationCode,
  mpesaStatus, status, voidReason, voidedBy, voidedAt, createdAt
}
```

### users
```js
{
  id, name, role, pin, status, dateAdded, lastLogin,
  addedBy, forcePasswordChange
}
```

### Supporting Tables
- `pinChangeLogs`: Track all PIN changes
- `voidLogs`: Records of voided transactions
- `attemptedSales`: Failed M-Pesa payment attempts
- `pharmacyProfile`: Pharmacy settings and configuration

---

## Production Deployment

### Frontend Deployment (Vercel, Netlify, Railway)

#### 1. Build for Production
```bash
npm run build
# Creates optimized build in dist/
```

#### 2. Deploy to Vercel

```bash
npm install -g vercel
vercel
# Follow prompts to deploy
```

Environment variables to set in Vercel dashboard:
```
VITE_PROXY_URL=https://proxy-api.yourdomain.com
```

#### 3. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Backend Deployment (Railway, Render, Heroku)

#### 1. Deploy to Railway

```bash
cd proxy-server

# Setup Railway project
railway link

# Set environment variables
railway variables set MPESA_CONSUMER_KEY=xxx
railway variables set MPESA_CONSUMER_SECRET=xxx
# ... set all variables

# Deploy
railway up
```

#### 2. Deploy to Render

1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Select GitHub repository
4. Set environment variables
5. Deploy

### 3. Switch from Sandbox to Production

Once deployed and tested:

1. **In Daraja Dashboard**: Activate production credentials
2. **Update proxy-server/.env**:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=production_key
   MPESA_CONSUMER_SECRET=production_secret
   MPESA_PASSKEY=production_passkey
   ```
3. **Update M-Pesa callback URL** in Daraja to production domain
4. **Test with real M-Pesa transactions** (use real phone number)

---

## Anti-Fraud & Security Measures

1. **Authentication**: 4-digit PIN with SHA-256 hashing
2. **Account Lockout**: 5 failed attempts = 5-minute lockout
3. **Session Timeout**: Auto-logout after 30 minutes inactivity
4. **Stock Integrity**: Stock only changes on confirmed payment
5. **Immutable Records**: Sales cannot be edited, only voided
6. **Void Logging**: Every void requires reason (min 10 chars) and audit trail
7. **Role-Based Access**: Cashiers cannot access admin screens
8. **Rate Limiting**: Max 10 STK push requests per IP per minute
9. **PIN Validation**: Trivial PINs (0000, 1234) rejected
10. **Receipt Numbers**: Sequential with gap detection

---

## API Reference

### M-Pesa Endpoints

#### POST `/api/mpesa/stkpush`
Trigger M-Pesa payment request
```bash
curl -X POST http://localhost:3001/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": 1000,
    "receiptRef": "RCP-000001"
  }'
```

#### GET `/api/mpesa/status/:checkoutRequestId`
Check payment status
```bash
curl http://localhost:3001/api/mpesa/status/ws_CO_DMZ_1234567890
```

#### POST `/api/mpesa/callback`
Daraja calls this with payment results (configured in Daraja)

#### POST `/api/mpesa/query`
Query M-Pesa payment status directly

---

## Troubleshooting

### M-Pesa STK Push Not Working

**Check**:
1. Proxy server is running: `curl http://localhost:3001/health` → should return `{"status":"OK"}`
2. Environment variables are set correctly
3. Phone number is in correct format (254XXXXXXXXX)
4. Consumer key/secret are valid
5. Sandbox/Production environment matches

### App Not Syncing Offline Data

**Solution**:
1. Clear service worker: DevTools → Application → Clear storage
2. Run app online once to sync
3. Check IndexedDB: DevTools → Application → IndexedDB → PharmacyOS

### Receipt Not Printing

**Check**:
1. Browser print settings (no scaling, margins set)
2. Browser pop-up blocker
3. Try PDF download instead

---

## Performance Tips

1. **Mobile Optimization**: App uses ~5MB disk space (IndexedDB)
2. **Network**: Works on 2G/3G/4G/WiFi
3. **Battery**: Service Worker caches resources for minimal network use
4. **Database**: Paginated tables (20 items per page)

---

## Backup & Recovery

### Automatic Backups
```javascript
// In Settings → Data Management
// Export all data as JSON
exportToJSON(allData, 'backup.json')

// Import from backup
importFromJSON(backupFile)
```

### Manual Backup
```bash
# Export to CSV (can open in Excel)
// In app: Settings → Export Inventory/Sales
```

---

## Development & Customization

### Add New Drug Category
Edit `src/pages/Inventory.jsx`:
```javascript
const categories = [
  'Analgesic', 'Antibiotic', 'NSAID', 'Antidiabetic',
  'YourNewCategory', // Add here
]
```

### Change Primary Color
Edit `tailwind.config.js` and update the teal color values

### Add New Report
1. Create component in `src/components/reports/`
2. Add route in `src/App.jsx`
3. Link from navigation

### Extend M-Pesa Integration
- Edit `src/utils/mpesa.js` for client-side logic
- Edit `proxy-server/routes/mpesa.js` for server-side logic

---

## Testing Checklist

- [ ] Login with default credentials → Change PIN
- [ ] Add new drug to inventory
- [ ] Perform cash sale
- [ ] Perform M-Pesa sale (sandbox)
- [ ] Print receipt
- [ ] Export inventory to CSV
- [ ] Void a sale
- [ ] Add staff member
- [ ] Deactivate staff account
- [ ] Test offline (disable network in DevTools)
- [ ] Install as PWA (mobile home screen)

---

## FAQs

**Q: Can I use this without M-Pesa?**
A: Yes. The app works fully in cash-only mode. Just don't enable M-Pesa in settings.

**Q: How do I migrate from another POS system?**
A: Export drug data as CSV, use Settings → Import to load into PharmacyOS.

**Q: Is data encrypted?**
A: Data is stored locally in browser IndexedDB (encrypted by browser). Use HTTPS in production.

**Q: Can multiple users use the same device?**
A: Yes. Each login is separate, but data is shared. For multi-location setup, use separate devices.

**Q: How long does offline mode work?**
A: Indefinitely - all app resources are cached and database is local.

---

## License

Proprietary - PharmacyOS 2024

---

## Support

For issues, feature requests, or customization:
- Documentation: See code comments
- M-Pesa API: [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- Deploy Help: Refer to Vercel/Railway/Render docs

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
