# Repository Analysis: Adaptive Practice System

## 📋 Project Overview

**assesment-sistem2** is an **Adaptive Learning Assessment Platform** designed to provide personalized educational feedback based on individual student cognitive profiles and pedagogical levels.

The system uses:
- **AI-powered personalized feedback** via OpenRouter API (using DeepSeek R1 model)
- **Cognitive style assessment** to tailor content delivery
- **Multi-attempt adaptive hints** that escalate from subtle to explicit guidance
- **Full-stack TypeScript** for type safety across client and server

---

## 🏗️ Architecture Overview

### Directory Structure

```
assesment-sistem2/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── App.tsx                 # Main app with page routing
│   │   ├── components/             # Reusable UI components
│   │   ├── contexts/               # React Context (SurveyContext)
│   │   ├── pages/                  # Main pages (Profiling, Quiz, Evaluation, Thank You)
│   │   ├── services/               # API client services
│   │   ├── supabase.ts            # Supabase client initialization
│   │   └── types/                  # TypeScript definitions
│   ├── index.html
│   └── package.json
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── server.ts               # Express app setup
│   │   ├── openrouterService.ts   # OpenRouter API integration
│   │   ├── generateDataset.ts      # Dataset generation (root level)
│   │   ├── controllers/            # Route handlers (EMPTY - missing implementation)
│   │   ├── middleware/             # Express middleware (EMPTY - missing implementation)
│   │   ├── services/               # Business logic (EMPTY)
│   │   └── scripts/                # Data processing scripts
│   │       ├── generateDataset.ts
│   │       ├── generateDatasetFinal.ts
│   │       ├── generateAndEvaluate.ts
│   │       ├── generateFeedbackControl.ts
│   │       └── generataDataset.ts  # ⚠️ TYPO: "generat**a**" instead of "generat**e**"
│   └── package.json
│
├── shared/                          # Shared Utilities
│   ├── types.ts                    # Shared type definitions
│   └── questions.ts                # 20 assessment questions
│
└── output/                          # Generated data files (empty)
```

---

## 🎯 Core Functionality

### 1. **Student Profiling**
Students answer questions to establish their **cognitive style profile**:

```typescript
interface CognitiveStyle {
  visualPreference: 'T' | 'P';      // Text vs Pictures
  processingOrientation: 'G' | 'A'; // Global vs Analytic
  behavioralTempo: 'I' | 'R';       // Impulsive vs Reflective
}

interface StudentProfile {
  pedagogicalLevel: 1-6;             // Expertise level
  cognitiveStyle: CognitiveStyle;
  profileCode: string;               // e.g., "L2_T_G_I"
}
```

**Profile Code Format:** `L{level}_{visual}_{processing}_{tempo}`
- Example: `L3_T_G_R` = Level 3, Text-focused, Global processing, Reflective

### 2. **Adaptive Assessment**
- **20 questions** covering: algorithms, data structures, React, databases, networking, web dev, programming
- **Difficulty range:** 1-4 (progressively harder)
- **Multiple attempts** (up to 3) with escalating guidance

### 3. **Personalized Feedback Loop**

**When answer is INCORRECT:**
```
AI generates hints based on:
  ├─ Attempt #1 → Subtle hint (guide toward pattern)
  ├─ Attempt #2 → Clearer hint (mention key concept)
  └─ Attempt #3 → Direct hint (almost reveal answer)

PLUS adaptation for:
  ├─ Pedagogical Level (language complexity)
  ├─ Visual Preference (text vs metaphors)
  ├─ Processing Style (big picture vs step-by-step)
  └─ Tempo (concise vs elaborate)
```

**When answer is CORRECT:**
```
AI generates explanation of WHY with:
  ├─ Brief praise
  ├─ Conceptual explanation
  ├─ Connection to broader concepts
  └─ Tailored to student profile
```

### 4. **API Endpoints**

```
POST /api/feedback
├─ Input: Question, student answer, profile, attempt number
├─ Uses: openrouterService.generateCorrectiveFeedback() OR generateExplanation()
└─ Output: Adaptive feedback string

POST /api/explanation
├─ Input: Question, profile
├─ Uses: openrouterService.generateExplanation()
└─ Output: Detailed walkthrough

GET /health
└─ Output: { status: 'ok', message: 'Server is running' }
```

---

## ⚠️ Known Issues & Errors

### 1. **CRITICAL: Empty Controller Files**
```
Status: 🔴 BLOCKER
File: server/src/feedbackController.ts
Issue: File is EMPTY (0 bytes)
```

**Impact:** 
- API endpoints `/api/feedback` and `/api/explanation` cannot route to handlers
- Server will crash when requests hit these endpoints
- The imported functions `getFeedback`, `getExplanation` don't exist

**Required Implementation:**
```typescript
// server/src/controllers/feedbackController.ts
import { Request, Response } from 'express';
import { generateCorrectiveFeedback, generateExplanation } from '../openrouterService';

export async function getFeedback(req: Request, res: Response) {
  try {
    const { profileCode, isCorrect, studentAnswer, correctAnswer, questionText, attemptNumber, cognitiveStyle, pedagogicalLevel } = req.body;
    
    let feedback: string;
    if (isCorrect) {
      feedback = await generateExplanation({
        profileCode,
        pedagogicLevel: pedagogicalLevel,
        visualPreference: cognitiveStyle.visualPreference,
        processingOrientation: cognitiveStyle.processingOrientation,
        behavioralTempo: cognitiveStyle.behavioralTempo,
        questionText,
        correctAnswer,
        attemptNumber,
      });
    } else {
      feedback = await generateCorrectiveFeedback({
        profileCode,
        pedagogicLevel: pedagogicalLevel,
        visualPreference: cognitiveStyle.visualPreference,
        processingOrientation: cognitiveStyle.processingOrientation,
        behavioralTempo: cognitiveStyle.behavioralTempo,
        questionText,
        correctAnswer,
        studentAnswer,
        attemptNumber,
      });
    }
    
    res.json({ feedback, isCorrect });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getExplanation(req: Request, res: Response) {
  try {
    const { profileCode, questionText, correctAnswer, pedagogicalLevel, cognitiveStyle, attemptNumber } = req.body;
    
    const explanation = await generateExplanation({
      profileCode,
      pedagogicLevel: pedagogicalLevel,
      visualPreference: cognitiveStyle.visualPreference,
      processingOrientation: cognitiveStyle.processingOrientation,
      behavioralTempo: cognitiveStyle.behavioralTempo,
      questionText,
      correctAnswer,
      attemptNumber: attemptNumber || 1,
    });
    
    res.json({ explanation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

### 2. **CRITICAL: Missing Middleware**
```
Status: 🔴 BLOCKER
Files: 
  - server/src/middleware/validateRequest.ts (EMPTY)
  - server/src/middleware/errorHandler.ts (EMPTY)
```

**Impact:**
- Request validation doesn't work
- Errors aren't properly caught/formatted
- Server will crash on unexpected input

**Required Implementation:**
```typescript
// server/src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const { profileCode, cognitiveStyle, pedagogicalLevel, questionText } = req.body;
  
  if (!profileCode || !cognitiveStyle || pedagogicalLevel === undefined || !questionText) {
    return res.status(400).json({ 
      error: 'Missing required fields: profileCode, cognitiveStyle, pedagogicalLevel, questionText' 
    });
  }
  
  next();
}

// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
```

### 3. **CRITICAL: Empty Services Directory**
```
Status: 🔴 BLOCKER
File: server/src/services/ (EMPTY)
```

**Issue:** Services layer is missing. Business logic should be separated from controllers.

### 4. **⚠️ HIGH: Typo in Script Filename**
```
Status: 🟡 HIGH PRIORITY
File: server/src/scripts/generataDataset.ts
Issue: Filename has typo: "generat**a**" instead of "generat**e**"
```

**Current files:**
- `generateDataset.ts` ✅
- `generateDatesetFinal.ts` ❌ (another typo: "Dateset" instead of "Dataset")
- `generataDataset.ts` ❌ (typo: "generat**a**")

**Impact:** Confusing, hard to find correct script, npm scripts may reference wrong file

**Fix:** Rename to `generateDataset.ts` (standardize naming)

### 5. **⚠️ MEDIUM: Missing Environment Variables**
```
Status: 🟡 MEDIUM PRIORITY
File: server/.env.example
Content: Minimal (only 67 bytes)
```

**Missing critical vars:**
```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=deepseek/deepseek-r1
APP_NAME=adaptive-practice
APP_URL=http://localhost:3000
PORT=3001
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

### 6. **🟡 MEDIUM: Client-Server API URL Not Configured**
```
Status: 🟡 MEDIUM PRIORITY
File: client/.env.production
Issue: May have hardcoded API URL instead of environment variable
```

**Should be:**
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 7. **🟡 MEDIUM: No Request/Response Validation Schema**
```
Status: 🟡 MEDIUM PRIORITY
Issue: No Zod/Joi validation schemas defined
```

**Risk:** Type mismatches, undefined field access leading to runtime errors

### 8. **🟡 MEDIUM: Hardcoded CORS Policy**
```
File: server/src/server.ts, Line 13-15
Code:
  app.use(cors({
    origin: '*'  // ⚠️ SECURITY RISK
  }));
```

**Issue:** Allows requests from ANY origin (security vulnerability for production)

**Fix:**
```typescript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 9. **🟡 MEDIUM: No Error Handling in OpenRouter Service**
```
File: server/src/openrouterService.ts
Issue: If API key is missing, error thrown during module load (crashes immediately)
```

**Current (Line 10-12):**
```typescript
if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set in environment variables');
}
```

**Better approach:** Validate at runtime when API is actually called

### 10. **🟡 MEDIUM: No TypeScript Path Aliases**
```
Status: 🟡 MEDIUM PRIORITY
File: tsconfig.json
Issue: Complex imports like `../../../services/` instead of `@/services/`
```

**Add to tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@controllers/*": ["./src/controllers/*"],
      "@services/*": ["./src/services/*"]
    }
  }
}
```

### 11. **🟢 LOW: Duplicate Dataset Generation Scripts**
```
Files:
  - generateDataset.ts (in src/scripts/)
  - generateDataset.ts (in src/ root)
  - generateAndEvaluate.ts
  - generateFeedbackControl.ts
  - generateDatasetFinal.ts
```

**Issue:** Multiple scripts do similar work. Unclear which is the "main" one.

**npm scripts in package.json show:**
```json
"generate-dataset": "ts-node src/scripts/generateDataset.ts",
"generate-final": "ts-node src/scripts/generateDatasetFinal.ts",
"generate-and-evaluate": "ts-node src/scripts/generateAndEvaluate.ts",
"generate-feedback-full": "ts-node src/scripts/generateAndEvaluate.ts --full",
"generate-control": "ts-node src/scripts/generateFeedbackControl.ts",
"generate-control-full": "ts-node src/scripts/generateFeedbackControl.ts --full"
```

### 12. **🟢 LOW: Missing Client Context Implementation**
```
Status: 🟢 LOW PRIORITY
File: client/src/contexts/SurveyContext.tsx
Issue: Likely incomplete or minimal implementation
```

Should handle:
- Current page state (profiling → quiz → evaluation → thank-you)
- Student profile data
- Quiz progress/answers
- API communication

### 13. **🟢 LOW: No Error Boundaries**
```
Status: 🟢 LOW PRIORITY
Issue: React app has no error boundary components
```

**Risk:** One component crash crashes entire app

---

## 🚨 Priority Fix Checklist

### **CRITICAL (Blocks Deployment):**
- [ ] Implement `server/src/controllers/feedbackController.ts`
- [ ] Implement `server/src/middleware/validateRequest.ts`
- [ ] Implement `server/src/middleware/errorHandler.ts`
- [ ] Verify all environment variables in `.env`
- [ ] Test OpenRouter API connectivity

### **HIGH (Should Fix):**
- [ ] Rename/consolidate duplicate dataset scripts
- [ ] Fix file naming typos (`generataDataset.ts` → `generateDataset.ts`)
- [ ] Implement complete `SurveyContext` on client
- [ ] Add request validation schemas

### **MEDIUM (Should Fix Soon):**
- [ ] Fix CORS to specific origin instead of `*`
- [ ] Add TypeScript path aliases
- [ ] Implement comprehensive error handling
- [ ] Add client-side API URL configuration
- [ ] Move OpenRouter API key check to runtime

### **LOW (Nice to Have):**
- [ ] Add React Error Boundary
- [ ] Consolidate dataset generation into single utility
- [ ] Add logging/monitoring
- [ ] Add unit & integration tests

---

## 🔌 Dependencies

### **Client Dependencies:**
```json
{
  "@supabase/supabase-js": "^2.96.0",  // Database client
  "axios": "^1.6.2",                    // HTTP client
  "react": "^18.2.0",                   // UI library
  "react-dom": "^18.2.0",               // DOM rendering
  "uuid": "^13.0.0"                     // ID generation
}
```

### **Server Dependencies:**
```json
{
  "@supabase/supabase-js": "^2.39.3",  // Database client
  "axios": "^1.6.5",                    // HTTP client for OpenRouter API
  "cors": "^2.8.5",                     // CORS middleware
  "dotenv": "^16.3.1",                  // Environment variables
  "express": "^4.18.2"                  // Web framework
}
```

---

## 🌊 Data Flow

```
┌─────────────────┐
│  STUDENT        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  PROFILING PAGE                     │
│  (Cognitive Style Quiz)             │
│  → Generates Profile Code (e.g. L3_T_G_R)
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  QUIZ PAGE                          │
│  - Load question from shared/questions.ts
│  - Show options                      │
│  - Collect answer                    │
│  - Track attempts (max 3)            │
└────────┬────────────────────────────┘
         │
         ▼
    POST /api/feedback ◄─────────┐
    with:                         │
    ├─ profileCode               │
    ├─ cognitiveStyle            │
    ├─ pedagogicalLevel          │
    ├─ questionText              │
    ├─ studentAnswer             │
    ├─ correctAnswer             │
    ├─ isCorrect                 │
    └─ attemptNumber             │
         │                        │
         ▼                        │
    ┌──────────────────────────┐  │
    │ BACKEND                  │  │
    │ feedbackController       │──┘
    │   ↓                       │
    │ openrouterService.ts     │
    │   ├─ generateCorrectiveFeedback()
    │   └─ generateExplanation()
    │   ↓                       │
    │ OpenRouter API           │
    │ (DeepSeek R1)            │
    └──────────────────────────┘
         │
         ▼
    Returns adaptive feedback
         │
         ▼
┌─────────────────────────────────────┐
│  QUIZ PAGE (Display Feedback)       │
│  - Show personalized feedback       │
│  - Allow retry or proceed           │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  EVALUATION PAGE                    │
│  (Results Summary)                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  THANK YOU PAGE                     │
└─────────────────────────────────────┘
```

---

## 📊 Question Set Overview

- **Total Questions:** 20
- **Topics:** algorithms (4), data structures (1), networking (3), React (2), databases (3), web-development (2), programming (4), javascript (1), version-control (1)
- **Difficulty Range:** 1 (easiest) to 4 (hardest)
- **Format:** Multiple choice (4 options each)

---

## 🚀 Getting Started (Setup Guide)

### **Server Setup:**
```bash
cd server
npm install

# Create .env file with OpenRouter API key
cp .env.example .env
# Edit .env with:
# OPENROUTER_API_KEY=your_key_here
# AI_MODEL=deepseek/deepseek-r1
# PORT=3001

npm run dev  # Start development server
```

### **Client Setup:**
```bash
cd client
npm install

# Create .env.local
VITE_API_BASE_URL=http://localhost:3001

npm run dev  # Start Vite dev server
```

### **Test Health Endpoint:**
```bash
curl http://localhost:3001/health
# Expected: { status: 'ok', message: 'Server is running' }
```

---

## 🔗 API Integration Points

### **Missing Implementation (Client → Server):**
1. Client needs to call `/api/feedback` after each answer
2. Error handling for API timeouts/failures not implemented
3. Retry logic for failed requests missing

### **Backend Issues:**
1. No request validation
2. No error handling middleware
3. Controllers not implemented
4. No logging/monitoring

---

## 📝 Summary

This is a **well-architected adaptive learning system** with:
✅ Clear separation of concerns (client/server/shared)
✅ Type-safe TypeScript implementation
✅ Intelligent AI-powered personalization
✅ Scalable question bank system

But it has **critical blockers**:
❌ Empty controller files (API endpoints non-functional)
❌ Missing middleware implementations
❌ No request validation
❌ Security issues (CORS, env vars)

**Next steps:** Implement missing controllers and middleware to make the system functional.
