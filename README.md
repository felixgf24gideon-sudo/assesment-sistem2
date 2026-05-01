# README - Adaptive Feedback Research System

**A lean, focused survey system for evaluating AI-personalized educational feedback based on cognitive learning styles.**

---

## 🎯 What This System Does

This is a **one-time online survey** that:

1. **Profiles** students on 3 cognitive dimensions:
   - Visual Preference (Text vs Pictures)
   - Processing Style (Global vs Analytical)
   - Behavioral Tempo (Impulsive vs Reflective)

2. **Administers** an 8-question adaptive quiz where:
   - Questions come from a Supabase database
   - Each answer gets personalized AI feedback (from OpenRouter/DeepSeek)
   - Feedback adapts based on the student's cognitive profile
   - Students can retry incorrect answers with escalating hints

3. **Evaluates** feedback quality on a 10-item rubric:
   - Accuracy of explanation
   - Clarity of language
   - Fit to learning style
   - Appropriate pacing
   - Learning impact
   - Plus open-ended feedback

4. **Saves** all research data for analysis

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+
- Supabase account (for questions database)
- OpenRouter API key (for AI feedback)

### **1. Setup Server**
```bash
cd server
npm install

# Create .env
cat > .env << EOF
PORT=3001
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=deepseek/deepseek-r1
APP_NAME=adaptive-practice
APP_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
EOF

npm run dev
# Server runs on http://localhost:3001
```

### **2. Setup Client**
```bash
cd client
npm install

# Create .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
EOF

npm run dev
# Client runs on http://localhost:3000
```

### **3. Configure Supabase**
Create this table in your Supabase project:

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INT NOT NULL,
  difficulty INT,
  topic TEXT,
  cognitive_tag TEXT,
  is_active BOOLEAN DEFAULT true
);
```

### **4. Run Survey**
Open http://localhost:3000 and complete the survey!

---

## 📊 Survey Flow

```
START
  ↓
Profiling Page (2 min)
  → Select cognitive style (3 dimensions)
  → Generate profile code (e.g., L3_T_G_R)
  ↓
Quiz Page (10-15 min)
  → 8 random questions from Supabase
  → Submit answer → Get AI feedback (personalized!)
  → Can retry if wrong (up to 3 attempts)
  → Record response
  ↓
Evaluation Page (10 min)
  → For each question shown:
    → See your answer + feedback + correct answer
    → Rate feedback on 10 dimensions (Likert 1-5)
    → Optional: add comments
  ↓
Thank You Page
  → Survey complete
  → Data saved to Supabase
  ↓
END
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/feedback` | Get AI feedback for answer |
| POST | `/api/explanation` | Get detailed explanation |
| POST | `/api/survey/complete` | Save survey completion |
| GET | `/health` | Health check |
| GET | `/api/system/check` | System diagnostics |

### Example: Get Feedback
```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is the time complexity of binary search?",
    "correctAnswer": "O(log n)",
    "userAnswer": "O(n)",
    "profileCode": "L3_T_G_R",
    "isCorrect": false,
    "attemptNumber": 1,
    "difficulty": 3,
    "questionTopic": "algorithms"
  }'
```

---

## 🗂️ Project Structure

```
assesment-sistem2/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx           # Main router
│   │   ├── contexts/
│   │   │   └── SurveyContext.tsx    # State management
│   │   ├── pages/
│   │   │   ├── ProfilingPage.tsx    # Cognitive style selection
│   │   │   ├── QuizPage.tsx         # Quiz with AI feedback
│   │   │   ├── EvaluationPage.tsx   # Rubric evaluation
│   │   │   └── ThankYouPage.tsx     # Completion
│   │   ├── services/
│   │   │   └── supabase.ts          # Supabase client
│   │   └── ...
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── server.ts         # Express app
│   │   ├── openrouterService.ts    # AI service
│   │   ├── controllers/
│   │   │   └── feedbackController.ts       # Route handlers
│   │   ├── middleware/
│   │   │   ├── validateRequest.ts          # Input validation
│   │   │   └── errorHandler.ts             # Error handling
│   │   └── services/
│   │       └── supabaseService.ts          # DB operations
│   └── package.json
│
├── shared/                    # Shared types & data
│   ├── types.ts              # TypeScript interfaces
│   └── questions.ts          # Fallback questions
│
└── docs/
    ├── README.md             # This file
    ├── SETUP_SURVEY.md       # Detailed setup
    ├── API_REFERENCE.md      # API documentation
    ├── REPOSITORY_ANALYSIS.md # Architecture deep-dive
    └── ...
```

---

## 🧪 Research Study Design

**Question:** Does adapting AI feedback to student cognitive profiles improve perceived feedback quality?

**Variables:**
- **Independent:** Cognitive style profile (3 dimensions × levels)
- **Dependent:** Perceived feedback quality (10 Likert-scale items)

**Dimensions Evaluated:**
1. **Accuracy** - Does AI correctly identify errors?
2. **Clarity** - Is the explanation easy to understand?
3. **Personalization** - Does it match my learning style?
4. **Pacing** - Is the length appropriate?
5. **Empowerment** - Does it help me learn?

**Output:** Dataset ready for statistical analysis (ANOVA, regression, etc.)

---

## 📈 Data Collection

**Per Survey:**
- Student cognitive profile (text, ~50 bytes)
- 8 quiz responses with feedback (~5KB)
- 10 Likert ratings per question (~100 bytes)
- Optional open-ended feedback (~500 bytes)
- Timestamps (metadata)

**Total per survey:** ~10KB

**For 100 surveys:** ~1MB of research data

---

## 🔐 Security Notes

- No personal data collection (anonymous survey)
- All questions stored in Supabase (read-only for client)
- API key for OpenRouter stored server-side only
- CORS configured for specified origins
- Request validation on all endpoints

---

## 🛠️ Technologies

**Frontend:**
- React 18 with TypeScript
- Vite (fast bundler)
- Supabase client library
- TailwindCSS for styling

**Backend:**
- Express.js (Node.js framework)
- Supabase (database)
- OpenRouter API (DeepSeek R1 AI model)
- TypeScript for type safety

**Infrastructure:**
- Supabase (PostgreSQL database)
- OpenRouter (AI API)
- Deploy to: Render, Vercel, Railway, etc.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **README.md** | Overview (this file) |
| **SETUP_SURVEY.md** | Step-by-step setup guide |
| **API_REFERENCE.md** | Complete API documentation |
| **REPOSITORY_ANALYSIS.md** | Architecture & design |

---

## 🎓 For Research

This system is designed to be a **low-overhead survey instrument** for research on:
- Personalized learning
- AI in education
- Cognitive styles and learning
- Feedback quality perception
- Educational technology evaluation

**Ready for:** Thesis, conference papers, journal articles

---

## ⚡ System Status

✅ **Production Ready**
- Fully functional survey pipeline
- Error handling & validation
- AI feedback generation working
- Supabase integration complete
- Documentation comprehensive

---

## 📞 Support

For issues or questions, refer to:
- `SETUP_SURVEY.md` - Setup troubleshooting
- `API_REFERENCE.md` - API error codes
- `REPOSITORY_ANALYSIS.md` - Architecture questions

---

**Version:** 2.0 (Lean Survey System)  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-05-01
