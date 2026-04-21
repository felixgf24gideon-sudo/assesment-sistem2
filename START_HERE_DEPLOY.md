# 🚀 START HERE - QUICK DEPLOY PATH

## For Those Who Want to Deploy NOW! 

If you just want to deploy without reading everything, follow this:

---

## PART 1: PREPARATION (5 minutes)

### ✅ Verify fixes are applied

```bash
# From GitHub Codespace terminal, run:
grep "currentPage: 'profiling'" client/src/contexts/SurveyContext.tsx
grep "VITE_API_URL" client/src/pages/QuizPage.tsx
```

Both should return results. If not, run QUICK_FIX_GUIDE.md first.

### ✅ Test locally

```bash
# Terminal 1 - Backend
cd server
npm install && npm run build && npm start

# Terminal 2 - Frontend  
cd client
npm install && npm run dev
```

Go to http://localhost:3000 and complete full survey flow until thank-you page.

---

## PART 2: COMMIT TO GITHUB (2 minutes)

```bash
git add .
git commit -m "deploy: prepare for production

- Code fixes applied
- Vercel & Render config added
- Environment variables ready"
git push origin main
```

---

## PART 3A: DEPLOY FRONTEND (5 minutes)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd client
vercel --prod --no-git-question
```

Wait for deployment → Get URL like `https://assesment-xxx-client.vercel.app`

---

## PART 3B: DEPLOY BACKEND (10 minutes)

1. Go to https://render.com → Sign up with GitHub
2. Browse to repo: `assesment-sistem2`
3. Click **New +** → **Web Service**
4. Setup:
   - **Name**: assesment-backend
   - **Root Directory**: `server`
   - **Build**: `npm install && npm run build`
   - **Start**: `npm start`
5. **Environment Variables** (click Add):
   - `OPENROUTER_API_KEY` = get from https://openrouter.ai/keys
   - `AI_MODEL` = `google/gemma-3-27b-it`
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
6. Click **Create Web Service**

Wait → Get URL like `https://assesment-backend.render.com`

---

## PART 4: LINK FRONTEND TO BACKEND (3 minutes)

Update file: `client/.env.production`

```env
VITE_SUPABASE_URL=https://dkklimxdlimvuotmyevd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_RL6dprrOAIo7PhYxgvvuKA_8mLkvWf4
VITE_API_URL=https://assesment-backend.render.com
```

Replace `assesment-backend.render.com` with your actual URL.

Commit & push:
```bash
git add client/.env.production
git commit -m "chore: update backend URL"
git push origin main
```

Vercel auto-redeploys automatically ✅

---

## PART 5: TEST (5 minutes)

Visit: https://assesment-sistem2-client.vercel.app

1. Go through survey → should work
2. Open DevTools (F12) → Console tab
3. No errors should appear
4. Complete survey → check that data appears in Supabase

---

## 🎉 DONE!

Your app is now live in production!

- Frontend: https://assesment-xxx-client.vercel.app
- Backend: https://assesment-backend.render.com

---

## If Something Breaks:

1. Check STEP 7 in **DEPLOYMENT_CHECKLIST.md**
2. Or see **Troubleshooting** in **DEPLOYMENT_GUIDE.md**
3. Or check logs:
   - Vercel: `vercel logs --tail`
   - Render: Dashboard → Logs tab

---

## Need More Info?

See detailed guides:
- Full checklist: `DEPLOYMENT_CHECKLIST.md`
- Detailed steps: `DEPLOYMENT_GUIDE.md`
- Environment vars: `ENV_SETUP_GUIDE.md`

---

**Total Time**: ~30 minutes
**Difficulty**: Easy (just following steps)
**Result**: App live on internet! 🚀
