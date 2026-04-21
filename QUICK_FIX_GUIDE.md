# 🔧 QUICK FIX GUIDE

Berikut adalah langkah-langkah untuk fix 3 critical issues sebelum deploy.

---

## 🔴 FIX #1: Remove TEMP currentPage = 'evaluation'

**File**: `client/src/contexts/SurveyContext.tsx` (line 13)

**Current**:
```typescript
currentPage: 'evaluation', // TEMP: Change back to 'profiling' after screenshot
```

**Change to**:
```typescript
currentPage: 'profiling',
```

**Why**: Ensures users go through profiling → quiz → evaluation properly.

---

## 🔴 FIX #2: Remove Dummy Data

**File**: `client/src/contexts/SurveyContext.tsx` (line 16-28)

**Current**:
```typescript
const [state, setState] = useState<SurveyState>({
  profileCode: '3TGI',
  assessmentAnswers: {},
  questionsAnswered: [
    {
      question_id: 'sample-q1',
      question_text: 'Apa yang dimaksud dengan computational thinking?',
      selected_answer: 1,
      correct_answer: 0,
      correct_answer_text: 'Pendekatan sistematis untuk menyelesaikan masalah menggunakan konsep komputer',
      feedback: 'Jawaban Anda hampir benar...',
      is_correct: false,
      timestamp: new Date(),
    },
  ],
  evaluationResponses: [],
  sessionId: uuidv4(),
  currentPage: 'profiling',
  startedAt: new Date(),
  completedAt: null,
  biodata: undefined,
});
```

**Change to**:
```typescript
const [state, setState] = useState<SurveyState>({
  profileCode: null,
  assessmentAnswers: {},
  questionsAnswered: [],  // Empty array
  evaluationResponses: [],
  sessionId: uuidv4(),
  currentPage: 'profiling',
  startedAt: new Date(),
  completedAt: null,
  biodata: undefined,
});
```

**Why**: Real data should come from user interaction, not dummy data.

---

## 🔴 FIX #3: Add .env.local for API URL

**File**: `client/.env.local` (create new file if doesn't exist)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key
VITE_API_URL=http://localhost:3001
```

**Then update file**: `client/src/pages/QuizPage.tsx` (line 188)

**Current**:
```typescript
const response = await fetch('http://localhost:3001/api/feedback', {
```

**Change to**:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const response = await fetch(`${API_URL}/api/feedback`, {
```

**Why**: Makes it production-ready for Vercel/Netlify with environment variables.

---

## 🟡 OPTIONAL FIX #4: Add userProfile Validation

**File**: `server/src/controllers/feedbackController.ts` (line 17)

**After current validation, add**:
```typescript
// NEW: Validate userProfile
if (!userProfile || typeof userProfile !== 'string') {
  return res.status(400).json({
    error: 'userProfile is required and must be a string',
    received: userProfile
  });
}
```

**Why**: Ensures personalization is always applied correctly.

---

## 🟡 OPTIONAL FIX #5: Add Success Logging

**File**: `client/src/services/surveyService.ts` (line 8-24)

**Current**:
```typescript
const { error } = await supabase
  .from('survey_responses')
  .insert({
    session_id: state.sessionId,
    // ... data
  });

if (error) throw error;
```

**Add logging**:
```typescript
const { data, error } = await supabase
  .from('survey_responses')
  .insert({
    session_id: state.sessionId,
    // ... data
  });

if (error) {
  console.error('❌ Database insert failed:', error);
  throw error;
}

console.log('✅ Survey results saved successfully');
console.log(`   Session ID: ${state.sessionId}`);
console.log(`   Profile: ${state.profileCode}`);
console.log(`   Questions answered: ${state.questionsAnswered.length}`);
console.log(`   Evaluations: ${state.evaluationResponses.length}`);
```

**Why**: Makes debugging easier and confirms data was saved properly.

---

## ✅ VERIFICATION CHECKLIST

After applying fixes, test this flow:

- [ ] Start app → see ProfilingPage (not evaluation page)
- [ ] Answer 7 profiling questions → get profile code (e.g., 3TGI)
- [ ] See QuizPage with 8 questions
- [ ] Answer question → see personalized feedback from AI
- [ ] Complete 8 questions → move to EvaluationPage
- [ ] Rate all 10 dimensions → complete survey
- [ ] See thank you page
- [ ] Check Supabase: data should be in `survey_responses` table
- [ ] Check browser console: no errors

---

## 🚀 For Deployment to Vercel/Netlify

After local testing works:

1. **Update server `.env`** at deployment platform:
   - `OPENROUTER_API_KEY=...`
   - `AI_MODEL=google/gemma-3-27b-it`
   - `PORT=3001`

2. **Update client `.env.production`**:
   - `VITE_SUPABASE_URL=...same as before`
   - `VITE_SUPABASE_ANON_KEY=...same as before`
   - `VITE_API_URL=https://your-backend-url.vercel.app` (backend server URL)

3. **Re-deploy both client & server**

---

**Done! Your system is now production-ready 🎉**
