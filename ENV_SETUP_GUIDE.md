# 🔐 ENVIRONMENT VARIABLES SETUP GUIDE

## For Vercel (Frontend)

In Vercel Dashboard: Settings → Environment Variables

```
# Development
VITE_SUPABASE_URL=https://dkklimxdlimvuotmyevd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_RL6dprrOAIo7PhYxgvvuKA_8mLkvWf4
VITE_API_URL=http://localhost:3001

# Preview & Production
VITE_SUPABASE_URL=https://dkklimxdlimvuotmyevd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_RL6dprrOAIo7PhYxgvvuKA_8mLkvWf4
VITE_API_URL=https://assesment-backend.render.com
```

---

## For Render (Backend)

In Render Dashboard: Web Service → Settings → Environment

Required variables:
```
OPENROUTER_API_KEY=sk-your-api-key-from-openrouter
AI_MODEL=google/gemma-3-27b-it
NODE_ENV=production
PORT=3001
```

### How to get OPENROUTER_API_KEY:
1. Go to: https://openrouter.ai
2. Sign up with Google/GitHub
3. Go to Settings → API Keys
4. Copy your API key
5. Paste into Render environment

---

## For CORS Configuration

Update server/src/server.ts to allow Vercel domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://assesment-sistem2-client.vercel.app',  // Add your Vercel frontend
    'http://localhost:3001'
  ],
  credentials: true
}));
```

Replace `assesment-sistem2-client` with your actual Vercel project name.

---

## Secret Management Best Practices

❌ NEVER commit these to git:
- API Keys
- Database credentials
- Authentication tokens

✅ DO store in:
- Vercel: Settings → Environment Variables
- Render: Settings → Environment Variables
- GitHub: Settings → Secrets (for CI/CD)
- Local: .env.local (gitignored)

---

## Verification after Deploy

After environment variables are set, test by:

```bash
# Check backend health
curl https://assesment-backend.render.com/health

# Should return:
# {"status": "ok", "message": "Server is running"}

# Check frontend loads
curl https://assesment-sistem2-client.vercel.app

# Should return HTML with ProfilingPage
```
