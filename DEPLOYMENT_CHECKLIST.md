# ✅ DEPLOYMENT CHECKLIST - FOLLOW THIS STEP BY STEP

**Status**: Ready for Production Deploy
**Created**: April 21, 2026

---

## STEP 0: Verify All Code Fixes Applied

Before committing anything, verify the 3 critical fixes are in place:

- [ ] `client/src/contexts/SurveyContext.tsx` line 27: `currentPage: 'profiling'` (not 'evaluation')
- [ ] `client/src/contexts/SurveyContext.tsx` line 23: `profileCode: null` (not '3TGI')
- [ ] `client/src/contexts/SurveyContext.tsx` line 24: `questionsAnswered: []` (no dummy data)
- [ ] `client/src/pages/QuizPage.tsx` line 154: Using env variable `import.meta.env.VITE_API_URL`
- [ ] `client/.env.local` has `VITE_API_URL=http://localhost:3001`

**Command to check**:
```bash
grep -n "currentPage: 'profiling'" client/src/contexts/SurveyContext.tsx
grep -n "VITE_API_URL" client/src/pages/QuizPage.tsx
```

✅ If all show correct values, proceed to STEP 1

---

## STEP 1: Test Locally (Before Committing)

```bash
# Terminal 1: Start Backend
cd server
npm install
npm run build
npm start
# Should show: 🚀 Server running on http://localhost:3001

# Terminal 2: Start Frontend
cd client
npm install
npm run dev
# Should show: ➜  Local:   http://localhost:3000
```

### ✅ Manual Test Flow:
- [ ] Visit http://localhost:3000
- [ ] See ProfilingPage (not EvaluationPage)
- [ ] Answer 7 profiling questions
- [ ] See profile code (e.g., 3TGI)
- [ ] Click "Start Practice Quiz"
- [ ] See QuizPage with 1st question
- [ ] Submit an answer
- [ ] See AI-generated personalized feedback appear
- [ ] Complete 8 questions fully
- [ ] See EvaluationPage
- [ ] Rate all 10 dimensions
- [ ] Click Submit
- [ ] See ThankYouPage ✅
- [ ] Check browser console - no CORS errors
- [ ] Check Supabase: new row in `survey_responses` table

**If all pass** → Continue to STEP 2

---

## STEP 2: Commit & Push to GitHub

```bash
# Update from main (if needed)
git checkout main
git pull origin main

# Create production branch
git checkout -b deploy/production

# Add all changes
git add .

# Verify what will be committed
git status

# Should show these new/modified files:
# - client/vercel.json (new)
# - client/.env.production (new)
# - server/render.yaml (new)
# - client/.env.local (modified - has VITE_API_URL)
# - client/src/contexts/SurveyContext.tsx (modified - fixes)
# - client/src/pages/QuizPage.tsx (modified - fixes)
# - Plus 3 docs: DEPLOYMENT_GUIDE.md, ENV_SETUP_GUIDE.md, etc

# Commit
git commit -m "feat: prepare for production deployment

- Fix SurveyContext: remove temp data, set currentPage to profiling
- Fix QuizPage: use env variable for API URL
- Add Vercel config (vercel.json)
- Add Render config (render.yaml)
- Add production env variables (.env.production)
- Add deployment guides (DEPLOYMENT_GUIDE.md, ENV_SETUP_GUIDE.md)

Ready to deploy to Vercel (frontend) and Render (backend)"

# Push
git push origin deploy/production
```

**GitHub**: Create Pull Request from `deploy/production` → `main`
- [ ] Review changes
- [ ] Pass any required checks
- [ ] Merge to main

---

## STEP 3: Deploy Frontend to Vercel

### 3A: Install & Login

```bash
# Install Vercel CLI (global)
npm install -g vercel

# Login with GitHub
vercel login

# Should open browser to authenticate
```

### 3B: Deploy

```bash
# Navigate to client folder
cd client

# Deploy to production
vercel --prod --no-git-question

# When asked:
# "Connect to Git remote "origin" (y/N)?" → y
# "Found existing project? Link it?" → N (first time)
# "Project name?" → assesment-sistem2-client
# "Directory to output?" → .
# "Want to modify?" → N
```

⏳ **Wait for**: Deployment to complete (2-5 minutes)

### ✅ Result:
```
✅ Production: https://assesment-sistem2-client.vercel.app
```

**Save this URL!** You'll need it for backend CORS.

---

## STEP 4: Deploy Backend to Render

### 4A: Connect Repository

1. Go to: https://render.com
2. Click **Dashboard**
3. Click **New +** → **Web Service**
4. **Connect Repo** → Search "assesment-sistem2" → Connect
5. Authorize GitHub

### 4B: Configure Service

**Fill in**:
- **Name**: `assesment-backend`
- **Environment**: `Node`
- **Region**: (Choose your region, e.g., "Singapore")
- **Branch**: `main`
- **Root Directory**: `server` ⚠️ **IMPORTANT**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4C: Add Environment Variables

Click **Advanced** → **Add Environment Variable** for each:

| Key | Value |
|-----|-------|
| `OPENROUTER_API_KEY` | *Get from https://openrouter.ai/keys* |
| `AI_MODEL` | `google/gemma-3-27b-it` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### 4D: Create Service

Click **Create Web Service**

⏳ **Wait for**: First deployment (5-15 minutes)
- Check Logs tab to monitor

### ✅ Result:
```
✅ Production: https://assesment-backend.render.com
```

**Test**:
```bash
curl https://assesment-backend.render.com/health
# Should return: {"status":"ok","message":"Server is running"}
```

---

## STEP 5: Update Frontend with Backend URL

### After backend URL confirmed:

```bash
# Update production env file
# File: client/.env.production
# Change:
VITE_API_URL=https://assesment-backend.render.com

# Commit
git add client/.env.production
git commit -m "chore: update backend URL for production"
git push origin deploy/production

# Redeploy frontend
cd client
vercel --prod --no-git-question
```

⏳ **Wait for**: Redeployment (2 minutes)

---

## STEP 6: Update Backend CORS

In Render Dashboard → Web Service → Environment:

Add:
```
FRONTEND_URL=https://assesment-sistem2-client.vercel.app
```

Then **update server code** (recommended):

```typescript
// server/src/server.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://assesment-sistem2-client.vercel.app',  // ADD YOUR VERCEL URL
  ],
  credentials: true
}));
```

**Commit & push** → Render will auto-redeploy

---

## STEP 7: End-to-End Production Testing

### ✅ Test Checklist:

```
Frontend: https://assesment-sistem2-client.vercel.app
Backend: https://assesment-backend.render.com
Database: Supabase
```

- [ ] Frontend loads (no blank page)
- [ ] See ProfilingPage
- [ ] Answer profiling questions → get profile code
- [ ] Go to QuizPage
- [ ] Submit answer → see AI feedback (NOT error)
- [ ] Complete quiz → go to EvaluationPage
- [ ] Submit evaluation
- [ ] See ThankYouPage
- [ ] Check browser Network tab - no 404/500 errors
- [ ] Check Supabase dashboard - new data in `survey_responses`

**If anything fails** → See TROUBLESHOOTING section in DEPLOYMENT_GUIDE.md

---

## STEP 8: Cleanup & Documentation

```bash
# Merge deployment branch to main (if using PR)
git checkout main
git pull origin main
git merge deploy/production

# Tag production release
git tag -a v1.0.0 -m "Production deployment"
git push origin main
git push origin v1.0.0
```

---

## 📋 FINAL CHECKLIST

- [ ] Local testing complete
- [ ] All code committed & pushed
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Production testing passed
- [ ] Database receiving data
- [ ] Both services monitoring enabled

---

## 🔗 PRODUCTION LINKS

After completion, share these links:

| Service | URL |
|---------|-----|
| **Frontend** | https://assesment-sistem2-client.vercel.app |
| **Backend Health** | https://assesment-backend.render.com/health |
| **Backend API** | https://assesment-backend.render.com/api/feedback |
| **Supabase Dashboard** | https://app.supabase.com/projects |

---

## 🆘 TROUBLESHOOTING QUICK LINKS

- **Frontend not reaching backend**: Check `VITE_API_URL` and CORS
- **Render cold start**: Normal (30sec), happens when service unused for 15min
- **Build fails**: Check `npm run build` works locally first
- **Environment variables not loading**: Restart service in Render dashboard
- **Vercel deployment timeout**: Check `VITE_API_URL` is reachable

See detailed troubleshooting in `DEPLOYMENT_GUIDE.md` section FASE 6.

---

**Status**: ✅ READY TO DEPLOY
**Next**: Follow STEP 0-8 in order!
