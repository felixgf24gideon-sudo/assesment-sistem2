# 🚀 DEPLOYMENT GUIDE - STEP BY STEP

> **Target Platforms**: Vercel (Frontend) + Render (Backend)
> **Date**: April 21, 2026
> **Status**: Production Ready

---

## FASE 1: PERSIAPAN (Sebelum Deploy)

### ✅ Checklist Persiapan di GitHub Codespace

- [ ] Pull latest dari `main` branch
- [ ] Verifikasi semua fixes sudah applied (lihat QUICK_FIX_GUIDE.md)
- [ ] Test locally: `npm run dev` di client dan server
- [ ] Commit & push semua changes
- [ ] Buat branch baru: `git checkout -b deploy/production`

### ✅ File-File Yang Sudah Siap

Lihat section di bawah untuk setup yang sudah saya siapkan:
- [ ] `vercel.json` - Konfigurasi Vercel
- [ ] `render.yaml` - Konfigurasi Render
- [ ] `.env.production` - Environment variables production

---

## FASE 2: SETUP FRONTEND (Vercel)

### Langkah 1: Verifikasi `.env.production`

**File**: `client/.env.production`

```env
VITE_SUPABASE_URL=https://dkklimxdlimvuotmyevd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_RL6dprrOAIo7PhYxgvvuKA_8mLkvWf4
VITE_API_URL=https://assesment-backend.render.com
```

⚠️ **GANTI**: `https://assesment-backend.render.com` dengan URL backend Anda setelah deploy

### Langkah 2: Login ke Vercel

```bash
# Install Vercel CLI (kalau belum)
npm install -g vercel

# Login
vercel login
```

Anda akan redirect ke browser untuk authenticate.

### Langkah 3: Deploy Frontend

```bash
# Navigate ke client folder
cd client

# Deploy ke Vercel
vercel --prod

# Jawab pertanyaan:
# ? Set up and deploy "~/assesment-sistem2/client"? [Y/n] → Y
# ? Which scope should we deploy to? → (pilih account personal)
# ? Link to existing project? [y/N] → N
# ? What's your project's name? → assesment-sistem2-client
# ? In which directory is your code located? → .
# ? Want to modify these settings before deploying [y/N] → N
```

**Result**: Anda akan dapat URL seperti `https://assesment-sistem2-client.vercel.app`

---

## FASE 3: SETUP BACKEND (Render)

### Langkah 1: Prepare Backend Repository

Backend harus di GitHub repo terpisah ATAU di subfolder dengan special config.

**OPSI A**: Backend di repo terpisah (RECOMMENDED)
```bash
# 1. Buat repo baru: assesment-sistem2-backend
# 2. Copy folder server/ ke repo baru
# 3. Push ke GitHub
```

**OPSI B**: Backend di subfolder (current setup)
```bash
# Vercel sudah detect folder structure
# Render bisa deploy dari subfolder
```

### Langkah 2: Login ke Render

Pergi ke: https://render.com

1. Click "Sign Up" → GitHub
2. Authorize dengan GitHub
3. Akan auto-sync dengan repos

### Langkah 3: Create Web Service di Render

1. Dashboard → **New +** → **Web Service**
2. **Connect Repository**
   - Search: `assesment-sistem2`
   - Connect + Authorize GitHub
   - Select repository

3. **Configure Build Settings**
   - **Name**: `assesment-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest region
   - **Branch**: `main` (atau `feature/login-page`)
   - **Root Directory**: `server` (⚠️ PENTING)
   
4. **Build Command**:
   ```bash
   npm install
   ```

5. **Start Command**:
   ```bash
   npm start
   ```
   
   (atau pastikan `package.json` di server punya script `start`)

6. **Environment Variables** → Add:
   ```
   OPENROUTER_API_KEY=your-openrouter-key
   AI_MODEL=google/gemma-3-27b-it
   PORT=3001
   NODE_ENV=production
   ```

7. Click **Create Web Service**

**Result**: Backend akan deploy & dapat URL seperti `https://assesment-backend.render.com`

---

## FASE 4: UPDATE FRONTEND URL

### Setelah Backend Deploy:

1. Update `client/.env.production`:
   ```env
   VITE_API_URL=https://assesment-backend.render.com
   ```

2. Commit & push:
   ```bash
   git add client/.env.production
   git commit -m "chore: update backend URL for production"
   git push origin deploy/production
   ```

3. Redeploy frontend di Vercel:
   ```bash
   cd client
   vercel --prod
   ```

---

## FASE 5: TESTING PRODUCTION

### Test Links:
- Frontend: https://assesment-sistem2-client.vercel.app
- Backend: https://assesment-backend.render.com/health

### ✅ Checklist Testing:

- [ ] Frontend loads properly
- [ ] ProfilingPage accessible
- [ ] Can answer profiling questions
- [ ] Profile code calculated correctly
- [ ] QuizPage loads questions from Supabase
- [ ] Submit answer → AI feedback response (check Network tab)
- [ ] Complete quiz → EvaluationPage
- [ ] Submit evaluation → data saved to Supabase
- [ ] Thank you page shows
- [ ] Check Supabase: data appears di `survey_responses` table

---

## FASE 6: TROUBLESHOOTING

### Problem: Frontend can't reach backend

**Symptom**: Network error di browser console ketika submit quiz

**Fixes**:
1. Check `VITE_API_URL` di `.env.production` correct
2. Backend URL must include `https://`
3. Check CORS di server (should allow Vercel domain)
4. Test backend health: `curl https://assesment-backend.render.com/health`

**Update CORS** (jika perlu):
```typescript
// server/src/server.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://assesment-sistem2-client.vercel.app', // ADD THIS
  ],
  credentials: true
}));
```

### Problem: "Cannot find module" error di Render

**Fix**: Pastikan `package.json` di server folder punya script `start`:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js"  // ADD THIS
  }
}
```

### Problem: Environment variables not loading

**In Render Dashboard**:
1. Click Web Service
2. Settings → Environment
3. Verify semua variables ada
4. Restart service

---

## FASE 7: AUTOMATIC DEPLOYMENTS (OPTIONAL)

### Setup Auto-Deploy ketika Push ke GitHub

**Vercel**: Otomatis (sudah default)
- Push ke `main` → auto-deploy to production
- Push ke branch lain → preview deployment

**Render**: Setup manual trigger
1. Render Dashboard → Web Service → Settings
2. Look for "Deploy Hook"
3. Copy webhook URL
4. (Optional) Setup GitHub Actions untuk trigger

---

## FASE 8: MONITORING & MAINTENANCE

### Check Logs:

**Vercel**:
```bash
vercel logs https://assesment-sistem2-client.vercel.app --tail
```

**Render**:
- Dashboard → Web Service → Logs (real-time)

### Setup Alerts:
- Render: Settings → Notifications → Email on deploy failure
- Vercel: Settings → Notifications → Slack/Email

---

## QUICK REFERENCE COMMANDS

```bash
# Login to services
vercel login
# (Render login via browser)

# Deploy frontend
cd client && vercel --prod

# Check backend health
curl https://assesment-backend.render.com/health

# View live logs
vercel logs my-project.vercel.app --tail

# Rollback (if needed)
# Vercel: Use dashboard → Deployments → Redeploy
# Render: Click previous deployment & redeploy
```

---

## NEXT: Configuration Files Ready

See these files created for you:
- `vercel.json` - Vercel build config
- `render.yaml` - Render service config (optional)
- `server/package.json` - Needs `start` script
- `.env.production` - Production env vars

---

**💡 TIPS**:
- Render cold starts (~30sec on free tier) - normal
- Vercel free tier unlimited - very fast
- Supabase free tier: 2 projects, unlimited queries - perfect for this
- Save API keys in environment variables, NEVER in code

**Questions?** Check section below for troubleshooting.

---

**Document Version**: 1.0
**Ready for Deploy**: ✅ YES
