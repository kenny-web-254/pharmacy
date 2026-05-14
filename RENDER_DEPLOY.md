# PharmacyOS Deployment to Render

## Architecture

```
Render Platform
├── Frontend (Static Site) - React Vite build → https://pharmacy.onrender.com
└── Backend (Web Service) - Express proxy (port 10000) → https://pharmacy-api.onrender.com
```

**Important**: PharmacyOS uses **IndexedDB** (client-side browser storage). No MongoDB server required. The `MONGODB_URI` in `.env.example` is unused and can be ignored.

---

## Prerequisites

- ✅ Code pushed to GitHub: https://github.com/kenny-web-254/pharmacy.git
- ✅ Render account (sign up free at https://render.com)
- ✅ M-Pesa Daraja sandbox credentials (partial - you'll add passkey/shortcode later)

---

## Deployment Steps

### Step 1: Deploy Backend First (Web Service)

**Why backend first?** Frontend needs backend URL for `VITE_PROXY_URL`.

#### 1.1 Create Backend Service

1. Go to https://render.com → **Dashboard** → **New** → **Web Service**
2. Connect your GitHub account (if not connected)
3. Select repository: **`kenny-web-254/pharmacy`**
4. Configure:
   - **Name**: `pharmacy-api` (or any name)
   - **Environment**: `Node`
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `proxy-server` ⚠️ **IMPORTANT**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)
5. Click **"Create Web Service"**

#### 1.2 Backend Environment Variables

In Render Dashboard → `pharmacy-api` → **Environment** tab:

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `MPESA_CONSUMER_KEY` | `2sxZ8KBSLWveE96JlqB7mtttfHdvktTZ7u2F3KANs7egjvAe` | Provided credential |
| `MPESA_CONSUMER_SECRET` | `ZaJFsttXvJ2znXpwLgDxMmpVBH1MaSGP2m6jQPdGR21Pt18DbPwv4syKSGbrVe6G` | Provided credential |
| `MPESA_ENVIRONMENT` | `sandbox` | Change to `production` later |
| `MPESA_PASSKEY` | `SKIP_FOR_NOW` | Add later from Daraja |
| `MPESA_SHORTCODE` | `SKIP_FOR_NOW` | Add later from Daraja |
| `MPESA_CALLBACK_URL` | `https://pharmacy-api.onrender.com/api/mpesa/callback` | Auto-set (Render URL) |
| `PORT` | `10000` | **Required by Render** (auto-injected but set explicitly) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,https://pharmacy.onrender.com` | Update after frontend deploys |

**IMPORTANT**: Render uses port **10000** (you can also use `$PORT` env var which Render sets automatically). The `server.js` already uses `process.env.PORT || 3001`, so it works.

**Click "Save Changes"** → Render auto-deploys.

**Wait** ~2-3 minutes for deployment. Copy your backend URL:
```
https://pharmacy-api.onrender.com
```

---

### Step 2: Deploy Frontend (Static Site)

#### 2.1 Create Static Site Service

1. In Render Dashboard → **New** → **Static Site**
2. Select repository: **`kenny-web-254/pharmacy`**
3. Configure:
   - **Name**: `pharmacy` (or any)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank - root of repo)*
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Build Filter**: Leave default
4. Click **"Create Static Site"**

#### 2.2 Frontend Environment Variables

In Render Dashboard → `pharmacy` → **Environment** tab:

Add:
```
VITE_PROXY_URL=https://pharmacy-api.onrender.com
```

**Click "Save Changes"** → Render rebuilds and deploys.

**Wait** ~2 min → Copy frontend URL:
```
https://pharmacy.onrender.com
```

---

### Step 3: Update Backend CORS Settings

Now that frontend URL is known:

1. Go back to **Backend Service** (`pharmacy-api`)
2. **Environment** → Update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://pharmacy.onrender.com,http://localhost:5173
```
3. Save → Backend auto-redeploys

---

## Step 4: Verify Deployment

### Health Check

```bash
# Backend health
curl https://pharmacy-api.onrender.com/health
# Expected: {"status":"OK","timestamp":"2026-..."}

# Frontend (should return HTML)
curl https://pharmacy.onrender.com
# Should return full HTML page
```

### Test in Browser

1. Open: `https://pharmacy.onrender.com`
2. Login: **Admin** / **0000**
3. ✅ Add a drug
4. ✅ Make a cash sale
5. ✅ Generate receipt
6. ✅ View dashboard

**M-Pesa payments** will fail until you add `MPESA_PASSKEY` and `MPESA_SHORTCODE` (next step).

---

## Step 5: Add Missing M-Pesa Credentials (You Handle Later)

### Get Credentials from Daraja Dashboard

1. Go to https://developer.safaricom.co.ke
2. Login → **Applications** → **My Apps** → Select your app
3. Copy:
   - **Shortcode** (e.g., `174379` for sandbox)
   - **Passkey** (from Security Credentials - generate if missing)
4. Note: `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` already provided

### Update Render Backend Variables

In Render Dashboard → `pharmacy-api` → **Environment**:

Update these variables:
```
MPESA_PASSKEY=your_actual_passkey_here
MPESA_SHORTCODE=174379  # or your actual shortcode
MPESA_CALLBACK_URL=https://pharmacy-api.onrender.com/api/mpesa/callback
```

**Save** → Render auto-redeploys → M-Pesa works.

---

## Step 6: Test M-Pesa (After Adding Credentials)

```bash
# Test STK Push (sandbox phone)
curl -X POST https://pharmacy-api.onrender.com/api/mpesa/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254708123456",
    "amount": 1,
    "receiptRef": "TEST-001"
  }'
```

Expected response:
```json
{
  "success": true,
  "checkoutRequestId": "...",
  "message": "STK push sent successfully"
}
```

---

## Important: Render Free Tier Considerations

### Web Service (Backend)
- **Sleeps after 15 min inactivity** (free tier)
- **Cold start** ~30-60 sec when waking
- Upgrade to paid plan ($7/month) for always-on
- **Solution**: Use UptimeRobot to ping every 10 min (keeps awake)

### Static Site (Frontend)
- **Always online** (free tier)
- Global CDN
- No sleep

### Keep Backend Awake (Optional)

Set up a monitor:
```bash
# Use UptimeRobot (free)
1. Sign up: https://uptimerobot.com
2. Add Monitor → HTTP(s)
3. URL: https://pharmacy-api.onrender.com/health
4. Interval: 5 minutes
```

---

## Production Switch (Sandbox → Production)

After testing works in sandbox:

1. Get **production credentials** from Daraja Dashboard
2. Update Render backend variables:
```
MPESA_CONSUMER_KEY=prod_consumer_key
MPESA_CONSUMER_SECRET=prod_consumer_secret
MPESA_PASSKEY=prod_passkey
MPESA_SHORTCODE=your_prod_shortcode
MPESA_ENVIRONMENT=production
```
3. Update `MPESA_CALLBACK_URL` if domain changes
4. In Daraja Dashboard: Update callback URL to production backend URL
5. Save → Redeploy

---

## Troubleshooting

### Backend fails to start
**Check**: Render logs (Service → Logs)
```bash
# Common issues:
# - PORT not set (Render uses 10000, but server.js uses process.env.PORT || 3001)
# - Missing required env vars (ALLOWED_ORIGINS, MPESA_*)
```

### Frontend build fails
**Check**:
```
npm install (no errors)
npm run build (works locally)
```
Ensure Node version in Render is 18+.

### 502 Bad Gateway (Backend)
**Cause**: Server crashed or not listening on correct port.
**Fix**: Ensure `PORT` environment variable is set to `10000` in Render.

### M-Pesa 4XX Errors
**Check**:
- `MPESA_PASSKEY` and `MPESA_SHORTCODE` are set (not "SKIP")
- `MPESA_CALLBACK_URL` is reachable from Safaricom (use `https://`)
- Phone number format: `2547XXXXXXXX` (no leading 0)

### CORS Errors
**Fix**: Update `ALLOWED_ORIGINS` to match your frontend URL exactly.

---

## Commands Reference

```bash
# Local backend
cd proxy-server
npm start

# Local frontend
npm run dev

# Build frontend
npm run build

# Test backend
curl http://localhost:3001/health

# View Render logs (if using Render CLI)
render logs

# Trigger redeploy (via webhook or git push)
git add .
git commit -m "trigger redeploy"
git push
```

---

## Success Criteria

✅ Backend: `https://pharmacy-api.onrender.com/health` returns `{"status":"OK"}`
✅ Frontend: `https://pharmacy.onrender.com` loads React app
✅ Login works (Admin/0000), add drugs, make sales
✅ Backend logs show no errors
✅ M-Pesa endpoints respond (may show auth error if credentials missing)

---

## Quick Checklist

- [ ] Code pushed to GitHub (master/main)
- [ ] Backend service created (root: `proxy-server`)
- [ ] Backend env vars set (including `PORT=10000`)
- [ ] Frontend static site created (publish: `dist`)
- [ ] Frontend env var `VITE_PROXY_URL` set
- [ ] Backend `ALLOWED_ORIGINS` updated with frontend URL
- [ ] Health checks pass
- [ ] App loads in browser
- [ ] Basic functionality tested (non-M-Pesa)

---

## Need Help?

- Render Docs: https://render.com/docs
- Railway vs Render: Render free tier sleeps; Railway has $5/month hobby plan that doesn't sleep
- M-Pesa Daraja: https://developer.safaricom.co.ke

---

**Ready to deploy?** Follow Steps 1-3. It takes ~10 minutes.
