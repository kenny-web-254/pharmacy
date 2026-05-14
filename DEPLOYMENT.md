# Immediate Deployment Guide: Railway (Production Ready)

**Goal**: Deploy PharmacyOS to Railway with M-Pesa credentials ready for later configuration.

**Note**: The app uses **IndexedDB** (client-side storage). No MongoDB server required.

---

## Pre-Deployment Checklist

- [ ] Test all features locally (POS, inventory, reports, M-Pesa)
- [ ] Get M-Pesa Daraja API credentials (sandbox first, then production)
- [ ] Generate production-grade icons (convert SVGs to PNGs)
- [ ] Set up error tracking (optional: Sentry, LogRocket)
- [ ] Plan downtime if migrating from existing POS
- [ ] Train staff on new system
- [ ] Ensure `.env` file exists in `proxy-server/` (see Section 2.1)

---

## Option 1: Deploy to Railway (Recommended)

Railway handles both frontend and backend with automatic HTTPS, environment variables, and zero-config deployment.

### Architecture Overview

```
┌─────────────────────────────────────┐
│   Railway Project (pharmacy)        │
│  ┌──────────────────────────────┐  │
│  │ Frontend Service (root)      │  │ → https://pharmacy.up.railway.app
│  │ - Build: npm run build       │  │
│  │ - Static files from /dist    │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Backend Service (proxy-server)│  │ → https://pharmacy-proxy.up.railway.app
│  │ - Start: npm start           │  │
│  │ - Port: 3001                 │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Step 1: Push Code to GitHub

```bash
cd C:\Users\kenro\Documents\surecreate\pharmacyos

# Initialize git (if not already)
git init

# Stage all files
git add .

# Commit
git commit -m "Initial commit: PharmacyOS"

# Add remote repository
git remote add origin https://github.com/kenny-web-254/pharmacy.git

# Set branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy Frontend

1. Go to [railway.app](https://railway.app) → **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose repository: **`kenny-web-254/pharmacy`**
4. Root directory: **Leave blank** (deploys from repository root)
5. Railway auto-detects:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Dev command**: `npm run dev`
   - **Start command**: `npm run preview`

6. Click **"Deploy"** and wait for build to complete

7. After deployment, copy the generated URL (e.g., `https://pharmacy.up.railway.app`)

### Step 3: Configure Frontend Environment Variables

In Railway Dashboard → **Frontend Service** → **Variables**:

```
VITE_PROXY_URL=https://pharmacy-proxy.up.railway.app
```

**Trigger redeploy**: Railway auto-redeploys when variables change.

---

## Deploy Backend (M-Pesa Proxy)

### Step 1: Create Backend Service

1. In your Railway project, click **"+ New"** → **"Service"**
2. Select **"Deploy from GitHub repo"**
3. Choose repository: **`kenny-web-254/pharmacy`**
4. **Root directory**: `proxy-server`
5. Railway auto-detects:
   - **Framework**: Node.js
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Port**: 3001 (from `server.js`)

6. Click **"Deploy"**

### Step 2: Backend Environment Variables

In Railway Dashboard → **Backend Service** → **Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `MPESA_CONSUMER_KEY` | `2sxZ8KBSLWveE96JlqB7mtttfHdvktTZ7u2F3KANs7egjvAe` | Yes |
| `MPESA_CONSUMER_SECRET` | `ZaJFsttXvJ2znXpwLgDxMmpVBH1MaSGP2m6jQPdGR21Pt18DbPwv4syKSGbrVe6G` | Yes |
| `MPESA_PASSKEY` | `[YOUR_PASSKEY_FROM_DARAJA]` | **Yes** - See Section 3.4 |
| `MPESA_SHORTCODE` | `[YOUR_SHORTCODE_FROM_DARAJA]` | **Yes** - See Section 3.4 |
| `MPESA_CALLBACK_URL` | `https://pharmacy-proxy.up.railway.app/api/mpesa/callback` | Yes |
| `MPESA_ENVIRONMENT` | `sandbox` | Yes (change to `production` later) |
| `PORT` | `3001` | Auto-set by Railway |
| `ALLOWED_ORIGINS` | `https://pharmacy.up.railway.app,http://localhost:5173` | Yes |

**⚠️ Important**: 
- Replace `pharmacy-proxy.up.railway.app` with your actual backend domain
- Replace `pharmacy.up.railway.app` with your actual frontend domain
- **Obtain `MPESA_PASSKEY` and `MPESA_SHORTCODE`** from M-Pesa Daraja Dashboard (Section 3.4)

### Step 3: Verify Deployment

After Railway finishes deploying:

1. **Copy your service URLs**:
   - Frontend: Click on your frontend service → "Settings" → Copy domain
   - Backend: Click on your backend service → "Settings" → Copy domain

2. **Update environment variables** with actual URLs:
   - Frontend `VITE_PROXY_URL` → your backend URL
   - Backend `MPESA_CALLBACK_URL` → your backend URL + `/api/mpesa/callback`
   - Backend `ALLOWED_ORIGINS` → your frontend URL

3. **Trigger redeploy** by pushing a minor change or manually redeploying

---

### Step 4: Obtain M-Pesa Passkey & Shortcode

The provided `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` are complete. However, two additional **required** fields must be obtained from the M-Pesa Daraja Dashboard:

#### Getting MPESA_SHORTCODE

1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Login to your Safaricom Developer account
3. Navigate: **Applications** → **My Apps**
4. Select your application
5. Copy the **"Shortcode"** (e.g., `174379` is the standard sandbox shortcode)

#### Getting MPESA_PASSKEY

1. In your app details page on Daraja Dashboard
2. Navigate to **"Security Credentials"** or **"API Settings"**
3. Locate the **"Passkey"** field (sometimes called "Public Key" or "Certificate Passphrase")
4. If missing, click **"Generate New Passkey"** and copy it immediately

#### Update Railway Variables

In Railway Dashboard → Backend Service → Variables:
```
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_actual_passkey_here
```

Railway auto-redeploys when variables change.

---

## Option 2: Deploy Frontend to Vercel, Backend to Railway

Vercel is optimized for React/Next.js frontends, Railway for backends.

### Frontend (Vercel)

1. **Push to GitHub** (same as above)

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
    - Select your GitHub repository
    - Import settings:
      - Framework: `Vite`
      - Root directory: `./`
      - Build command: `npm run build`
      - Output directory: `dist`

 3. **Environment variables**
    - Go to Settings → Environment Variables
    - Add:
      ```
      VITE_PROXY_URL=https://pharmacy-proxy.up.railway.app
      ```

 4. **Deploy**
    - Vercel automatically deploys on git push
    - Available at: `https://pharmacy.vercel.app` (or your custom domain)

### Backend (Railway)

Follow same steps as "Option 1: Backend Deployment" above.

---

## Option 3: Self-Hosted (VPS/Cloud VM)

For complete control, deploy on your own server (AWS, DigitalOcean, Linode, etc).

### Prerequisites
- Ubuntu 20.04+ server
- Nginx or Apache reverse proxy
- SSL certificate (free via Let's Encrypt)
- Node.js 18+

### Setup

1. **SSH into server**
   ```bash
   ssh root@your_server_ip
   ```

2. **Install dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs npm nginx certbot python3-certbot-nginx git
   ```

3. **Clone repository**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/pharmacyos.git
   cd pharmacyos
   npm install
   cd proxy-server
   npm install
   cd ..
   ```

4. **Build frontend**
   ```bash
   npm run build
   # Creates dist/ folder
   ```

5. **Configure Nginx**
   Create `/etc/nginx/sites-available/pharmacyos`:
   ```nginx
   server {
       listen 80;
       server_name pharmacy.yourdomain.com;

       # Frontend
       location / {
           root /var/www/pharmacyos/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend proxy
       location /api/ {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Enable SSL (Let's Encrypt)**
   ```bash
   sudo certbot certonly --nginx -d pharmacy.yourdomain.com
   # Follow prompts
   ```

   Update Nginx:
   ```nginx
   server {
       listen 443 ssl http2;
       ssl_certificate /etc/letsencrypt/live/pharmacy.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/pharmacy.yourdomain.com/privkey.pem;
       # ... rest of config
   }
   
   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name pharmacy.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

7. **Start backend service**
   Create `/etc/systemd/system/pharmacyos-proxy.service`:
   ```ini
   [Unit]
   Description=PharmacyOS Proxy Server
   After=network.target

   [Service]
   Type=simple
   User=nobody
   WorkingDirectory=/var/www/pharmacyos/proxy-server
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start:
   ```bash
   sudo systemctl enable pharmacyos-proxy
   sudo systemctl start pharmacyos-proxy
   sudo systemctl status pharmacyos-proxy
   ```

8. **Enable Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/pharmacyos /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup auto-renewal for SSL**
   ```bash
   sudo certbot renew --dry-run
   # Configure cron if needed
   ```

---

## Switching from Sandbox to Production

Once fully tested in sandbox mode, activate production credentials:

### 1. Get Production Credentials

In Daraja Dashboard:
- Navigate to "Applications"
- Select your app
- Click "Activate to Production"
- Copy production credentials

### 2. Update Backend Environment

**Railway Dashboard or your server:**
```bash
MPESA_CONSUMER_KEY=prod_consumer_key
MPESA_CONSUMER_SECRET=prod_consumer_secret
MPESA_PASSKEY=prod_passkey
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://pharmacy.yourdomain.com/api/mpesa/callback
```

### 3. Test with Real Transactions

1. Use your actual business shortcode
2. Make test payment with real M-Pesa account
3. Verify funds appear in M-Pesa account
4. Confirm receipt and stock deduction in app

### 4. Update Daraja Callback

In Daraja Dashboard:
- Update "Validation URL": `https://pharmacy.yourdomain.com/api/mpesa/callback`
- Update "Confirmation URL": `https://pharmacy.yourdomain.com/api/mpesa/callback`
- Enable HTTPS

---

## Post-Deployment Tasks

### 1. Verify Health

**Frontend:**
```bash
curl https://pharmacy.yourdomain.com
# Should load app
```

**Backend:**
```bash
curl https://pharmacy.yourdomain.com/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 2. Test Full Flow

1. Login (default: Admin / 0000)
2. Change admin PIN
3. Add a drug
4. Make cash sale
5. Make M-Pesa sale (test transaction)
6. Void a sale
7. Generate report
8. Export data

### 3. Backup

Create initial backup:
```bash
# In app: Settings → Download Backup
# Save to secure location
```

### 4. Monitor

Setup monitoring (optional but recommended):
- **Error Tracking**: Sentry, LogRocket
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Analytics**: Google Analytics

### 5. Create Staff Accounts

In app: Staff → Add Staff
- Create cashier accounts for staff
- Change their initial PINs

---

## Rollback Plan

If issues occur in production:

### Quick Rollback (Railway)
```bash
# In Railway dashboard
# Find the previous deployment
# Click "Rollback"
# Wait for deployment to complete
```

### Data Recovery
If data is corrupted:
1. Stop the app
2. Download backup from browser (if available)
3. Restore from backup file
4. Delete browser storage and reimport
5. Restart app

---

## Scaling & Performance

### Database Optimization

1. **Archive old sales** (optional)
   - Export sales older than 6 months to CSV
   - Clear from app to reduce database size

2. **Monitor database size**
   - DevTools → Application → IndexedDB → PharmacyOS
   - Size should stay under 50MB

### Server Optimization

1. **Enable caching** in Nginx:
   ```nginx
   location ~* \.(js|css|png|jpg|svg)$ {
       expires 30d;
       add_header Cache-Control "public, immutable";
   }
   ```

2. **Enable gzip compression** in Nginx:
   ```nginx
   gzip on;
   gzip_types text/css text/javascript application/json;
   gzip_min_length 1000;
   ```

---

## Troubleshooting

### Frontend Not Loading

**Check**:
1. CORS settings in backend
2. Proxy URL is correct
3. SSL certificate is valid
4. Browser console for errors

**Solution**:
```bash
# Clear browser cache
# Check ALLOWED_ORIGINS in .env
# Verify HTTPS is enabled
```

### M-Pesa Not Working

**Check**:
1. Backend health: `https://yourdomain.com/health`
2. Daraja credentials are correct
3. Phone number format (254xxxxxxxxx)
4. Network connectivity
5. Firewall rules allow outgoing HTTPS

**Test STK Push**:
```bash
curl -X POST https://pharmacy.yourdomain.com/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "amount": 1,
    "receiptRef": "TEST-001"
  }'
```

### Database Issues

**Clear offline data**:
1. DevTools → Application → Storage → Clear site data
2. Restart app
3. Login and sync

---

## Monitoring Checklist

- [ ] Server uptime (99%+ target)
- [ ] Response time (<2s for pages, <500ms for API)
- [ ] Error rate (<0.1%)
- [ ] Database size (<100MB)
- [ ] SSL certificate expiry
- [ ] Backup integrity (test restore monthly)

---

## Support & Updates

- **Bug Fixes**: Test in dev, deploy to staging, then production
- **Feature Updates**: Add feature, test, increment version, deploy
- **Security Patches**: Apply immediately after testing

---

## Quick Deploy Commands

```bash
# Local development (frontend)
npm run dev

# Build frontend for production
npm run build

# Test backend locally
cd proxy-server
npm start

# Push to GitHub
git add .
git commit -m "Deploy to Railway"
git push

# Railway CLI (optional)
npm i -g @railway/cli
railway login
railway link
railway up
```

---

## Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org)
- [Daraja API](https://developer.safaricom.co.ke)

---

**Last Updated**: 2024  
**Version**: 1.0.0
