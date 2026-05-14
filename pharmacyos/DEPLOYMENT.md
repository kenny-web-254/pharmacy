# PharmacyOS Deployment Guide

## Overview

This guide covers deploying PharmacyOS to production environments. The application consists of:
1. **Frontend**: React + Vite PWA (deployed on Vercel, Netlify, Railway, or self-hosted)
2. **Backend**: Express proxy server (deployed on Railway, Render, or self-hosted)

---

## Pre-Deployment Checklist

- [ ] Test all features locally (POS, inventory, reports, M-Pesa)
- [ ] Get M-Pesa Daraja API credentials (sandbox first, then production)
- [ ] Generate production-grade icons (convert SVGs to PNGs)
- [ ] Set up error tracking (optional: Sentry, LogRocket)
- [ ] Configure backup strategy
- [ ] Plan downtime if migrating from existing POS
- [ ] Train staff on new system

---

## Option 1: Deploy to Railway (Recommended - Simplest)

Railway handles both frontend and backend in one platform with automatic HTTPS, environment variables, and easy scaling.

### Frontend Deployment

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/kenny-web-254/pharmacy.git
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select **kenny-web-254/pharmacy** repository
   - Choose root directory (leave blank)

3. **Configure build settings**
   - Build command: `npm run build`
   - Start command: `npm run preview` (for testing) or let Railway autodetect
   - Environment: Node.js

4. **Add environment variables**
   In Railway dashboard → Variables:
   ```
   VITE_PROXY_URL=https://pharmacy-proxy.up.railway.app
   ```

5. **Deploy**
   - Railway automatically deploys from main branch
   - Frontend available at: `https://pharmacy.up.railway.app`

### Backend Deployment

1. **Create new Railway service**
   - New Project → Deploy from GitHub
   - Select same repository
   - Root directory: `proxy-server`

2. **Configure**
   - Build command: `npm install`
   - Start command: `npm start`
   - Port: 3001

3. **Add environment variables**
   ```
   MPESA_CONSUMER_KEY=2sxZ8KBSLWveE96JlqB7mtttfHdvktTZ7u2F3KANs7egjvAe
   MPESA_CONSUMER_SECRET=ZaJFsttXvJ2znXpwLgDxMmpVBH1MaSGP2m6jQPdGR21Pt18DbPwv4syKSGbrVe6G
   MPESA_SHORTCODE=N/A
   MPESA_PASSKEY=N/A
   MPESA_CALLBACK_URL=https://pharmacy-proxy.up.railway.app/api/mpesa/callback
   MPESA_ENVIRONMENT=sandbox
   ALLOWED_ORIGINS=https://pharmacy.up.railway.app,http://localhost:5173
   MONGODB_URI=mongodb+srv://kennyutugi_db_user:pharmacy@pharmacy.qbnqpzn.mongodb.net/?appName=pharmacy
   ```
   
   **⚠️ Note**: You need to get your **Shortcode** and **Passkey** from M-Pesa Daraja Dashboard:
   1. Go to [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
   2. Login to your M-Pesa account
   3. Navigate to "Applications" → Select your app
   4. Copy **Shortcode** from app details
   5. Copy **Passkey** from "Security Credentials"
   6. Update these values in Railway dashboard once you have them

4. **Deploy**
   - Backend available at: `https://pharmacy-proxy.up.railway.app`

5. **Test**
   ```bash
   curl https://pharmacy-proxy.up.railway.app/health
   # Should return: {"status":"OK","timestamp":"2024-..."}
   ```

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
     VITE_PROXY_URL=https://pharmacyos-proxy.up.railway.app
     ```

4. **Deploy**
   - Vercel automatically deploys on git push
   - Available at: `https://pharmacyos.vercel.app` (custom domain optional)

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
# Local development
npm run dev

# Build for production
npm run build

# Deploy frontend (Vercel)
vercel

# Deploy backend (Railway)
railway up

# SSH to VPS
ssh root@your_ip

# Check backend status
systemctl status pharmacyos-proxy

# View backend logs
journalctl -u pharmacyos-proxy -f

# Restart backend
systemctl restart pharmacyos-proxy
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
