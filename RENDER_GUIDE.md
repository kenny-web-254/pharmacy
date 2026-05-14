# PharmacyOS - Render Deployment Guide

## One-Click Deploy Button

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kenny-web-254/pharmacy)

Click the button above to deploy automatically.

---

## Manual Deploy (5 minutes)

### Architecture
```
Render
├── Static Site (Frontend) → https://pharmacy.onrender.com
└── Web Service (Backend) → https://pharmacy-api.onrender.com
```

**Database**: IndexedDB (client-side) - no server database needed.

---

## Step 1: Deploy Backend

1. Go to https://render.com/new
2. Select **"Web Service"**
3. Connect GitHub → `kenny-web-254/pharmacy`
4. Settings:
   - **Name**: `pharmacy-api`
   - **Environment**: Node
   - **Branch**: main
   - **Root Directory**: `proxy-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **"Create Web Service"**
6. Wait for deployment (~2 min)
7. Copy your backend URL: `https://pharmacy-api.onrender.com`

---

## Step 2: Deploy Frontend

1. In Render Dashboard → **New** → **Static Site**
2. Connect GitHub → `kenny-web-254/pharmacy`
3. Settings:
   - **Name**: `pharmacy`
   - **Branch**: main
   - **Root Directory**: *(blank)*
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Click **"Create Static Site"**
5. Wait (~2 min)
6. Copy frontend URL: `https://pharmacy.onrender.com`

---

## Step 3: Configure Environment Variables

### Backend Service (pharmacy-api)
Go to **Environment** tab → Add:

| Key | Value | Required |
|-----|-------|----------|
| `PORT` | `10000` | Yes |
| `ALLOWED_ORIGINS` | `https://pharmacy.onrender.com,http://localhost:5173` | Yes |

**Save** → Auto-redeploy.

### Frontend Service (pharmacy)
Go to **Environment** tab → Add:

| Key | Value |
|-----|-------|
| `VITE_PROXY_URL` | `https://pharmacy-api.onrender.com` |

**Save** → Auto-redeploy.

---

## Step 4: Update Backend CORS

After frontend deploys, update backend `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS=https://pharmacy.onrender.com,http://localhost:5173
```

Save → Redeploy.

---

## Step 5: Verify

```bash
# Backend health
curl https://pharmacy-api.onrender.com/health
# {"status":"OK","timestamp":"..."}

# Frontend
curl https://pharmacy.onrender.com
# Returns HTML
```

Open `https://pharmacy.onrender.com` in browser:
- Login: **Admin** / **0000**
- Add drug, make sale, generate receipt ✅

---

## Notes

- **No M-Pesa required** - backend works without it
- **Free tier**: Backend sleeps after 15 min inactivity (cold start on first request)
- **Upgrade**: $7/mo for always-on backend
- **Keep awake**: Use UptimeRobot to ping `/health` every 5 min

---

## Troubleshooting

**502 Bad Gateway** → Check backend logs; ensure PORT=10000 set.

**Build fails** → Ensure Node version 18+ (Render default is 18).

**CORS errors** → Update ALLOWED_ORIGINS with exact frontend URL.

---

**Deployment complete. App is live.**
