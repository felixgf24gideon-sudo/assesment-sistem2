# 🧠 ADAPTIVE PERSONALIZATION STRATEGY DOCUMENTATION

---

## 📊 4-DIMENSIONAL PROFILING SYSTEM

Sistem menggunakan 4 dimensi cognitive style yang independen untuk membuat profile code unik setiap user.

### Dimensi 1: LEVEL (Z-axis) — Vygotsky's Zone of Proximal Development

| Level | Description | Support | Example |
|-------|-------------|---------|---------|
| **1** | Completely beginner | Very high scaffolding | "Saya benar-benar baru di bidang ini" |
| **2** | Novice | High scaffolding + detail | "Pernah dengar tapi belum berani coba" |
| **3** | Intermediate | Moderate guidance | "Paham dasar, butuh petunjuk kecil" |
| **4** | Upper-intermediate | Minimal guidance | "Bisa mandiri, jarang butuh bantuan" |
| **5** | Advanced | Peer tutoring | "Menguasai, sering bantu teman" |
| **6** | Expert | Meta-analysis | "Analisis strategi & efisiensi" |

**Cognitive Load Theory**: Level 1-2 needs full scaffolding. Level 4-6 needs challenge & extension.

---

### Dimensi 2: VISUAL MODALITY (M-axis) — Dunn & Dunn Learning Styles

#### Text/Logic (T) Learners
**Karakteristik**:
- Prefer formula, definition, technical details
- Think in logical sequences
- Learn through step-by-step proof
- Language: formal, precise terminology

**AI Feedback Style**:
```
Format: Logical sequences, formal reasoning, step-by-step proof
Structure:
  1. State the logical error precisely
  2. Show where logic breaks down
  3. Present correct logical chain
  4. Provide mathematical or formal proof
Example: "Kesalahan terjadi di langkah 3. Anda mengasumsikan X, padahal..."
```

#### Picture/Analogy (P) Learners
**Karakteristik**:
- Prefer analogy, metaphor, conceptual imagery
- Think in patterns and relationships
- Learn through examples and stories
- Language: narrative, conversational

**AI Feedback Style**:
```
Format: Vivid analogies, metaphors, conceptual imagery
Structure:
  1. Open with relatable analogy: "Bayangkan..."
  2. Draw parallel: "Sama seperti X ke Y..."
  3. Apply to problem: "Di sini, Z ke W..."
  4. Concrete example: "Konkretnya: [example]"
Example: "Bayangkan algoritma ini seperti resep masak. Kamu skip langkah..."
```

---

### Dimensi 3: PROCESSING STYLE (S-axis) — Global vs Analytic

#### Global (G) Processors
**Karakteristik**:
- See "big picture" first
- Want to know the destination before route
- Understand through context & connections
- Learn whole → parts

**AI Feedback Structure**:
```
Order:
  1. State the BIG CONCEPT or main idea
  2. Explain how it breaks down into parts
  3. Point out the specific error in this case
  4. Summarize how it all fits together
Flow: Context → Details → Application
```

#### Analytic (A) Processors
**Karakteristik**:
- Want logical sequence from zero
- Need step-by-step foundation
- Understand through building blocks
- Learn parts → whole

**AI Feedback Structure**:
```
Order:
  1. Foundation or basic principle
  2. Build next layer
  3. Identify where reasoning failed
  4. Show correct progression
  5. Reach conclusion
Flow: Ground up → Logical chain → Result
```

---

### Dimensi 4: BEHAVIORAL TEMPO (T-axis) — Kagan Cognitive Tempo

#### Impulsive (I) — Fast Processors
**Charakteristik**:
- Want quick answers
- Prefer brevity
- Get bored with long explanations
- High speed, moderate accuracy

**Feedback Parameters**:
- Word limit: **30-100 words** (target: 60)
- First sentence MUST contain diagnosis
- One key insight per paragraph
- Use bullet points if needed
- Pure precision, no elaboration
- Get straight to the point

**Example**:
```
"Kesalahanmu di langkah 3: kamu anggap X = Y, padahal X ≠ Y.
Lihat: [proof]. Jadi jawaban yang benar adalah Z."
[Total: 28 words]
```

#### Reflective (R) — Slow Processors
**Karakteristik**:
- Want to understand deeply
- Prefer thorough explanations
- Like time to process
- Moderate speed, high accuracy

**Feedback Parameters**:
- Word limit: **120-300 words** (target: 200)
- Multiple paragraphs OK
- Provide context and scaffolding
- Show connections between concepts
- Elaborate to support understanding
- Take time to explain thoroughly

**Example**:
```
"Kesalahanmu terletak pada asumsi yang Anda buat di langkah 3. 
Mari kita lihat bersama apa yang terjadi...

Pada dasarnya, konsep X bekerja seperti ini: [explanation]. 
Dalam masalah ini, kondisinya adalah... [context]

Jika kita ikuti logika dengan teliti, kami akan menemukan bahwa X 
sebenarnya tidak sama dengan Y dalam kasus ini.

Jadi, jawaban yang benar adalah Z karena [reasoning]. 
Hal ini membantu kita memahami prinsip yang lebih dalam tentang..."
[Total: ~180 words]
```

---

## 🔄 PROFILE CODE GENERATION

### Format: `{Level}{Visual}{Processing}{Tempo}`

**Example**: `3TGI`
- **3**: Intermediate level (0-6)
- **T**: Text/Logic modality (T or P)
- **G**: Global processing (G or A)
- **I**: Impulsive tempo (I or R)

### Calculation Algorithm

```typescript
export function calculateProfileCode(answers: Record<string, number | string>): string {
  // Level: Direct 1-6 answer
  const level = clampLevel(answers['level-1'] as number);
  
  // Visual: Sum of 2 proxy questions (+1/-1 each)
  const modalityScore = sumAnswers(answers, ['modality-1', 'modality-2']);
  const modality = modalityScore > 0 ? 'T' : 'P';
  
  // Processing: Sum of 2 proxy questions (+1/-1 each)
  const processingScore = sumAnswers(answers, ['processing-1', 'processing-2']);
  const processing = processingScore > 0 ? 'G' : 'A';
  
  // Tempo: Sum of 2 proxy questions (+1/-1 each)
  const tempoScore = sumAnswers(answers, ['tempo-1', 'tempo-2']);
  const tempo = tempoScore > 0 ? 'I' : 'R';
  
  return `${level}${modality}${processing}${tempo}`;
}
```

### Interpretation

| Code | Profile Name | Characteristics |
|------|--------------|-----------------|
| 1TGI | Beginner/Quick-Thinker/Global/Logic | Needs high support, prefers short logical explanations with big picture |
| 3TGI | Intermediate/Quick-Thinker/Global/Logic | **Most balanced profile** - good for general users |
| 6PAR | Expert/Slow-Thinker/Analytic/Story | Advanced learner who wants detailed analogies step-by-step |
| 2PGR | Novice/Story-Learner/Global/Reflective | Needs support + analogies + big picture + time to reflect |

---

## 🤖 AI PROMPT GENERATION

### Step-by-Step Personalization

**Input**: Profile Code `3TGI` + Student's wrong answer + Correct answer

**Processing**:

1. **Parse Profile**:
   ```
   3TGI → { level: 3, visual: 'T', processing: 'G', tempo: 'I' }
   ```

2. **Extract Modality Rules**:
   ```
   Visual: T → Use "logical reasoning, step-by-step proof"
   ```

3. **Extract Structure Rules**:
   ```
   Processing: G → "Big idea first, then details"
   ```

4. **Extract Tempo Rules**:
   ```
   Tempo: I → "30-100 words, diagnose in first sentence"
   ```

5. **Get Personalized Motivation**:
   ```
   Profile IG → "Cepat tangkap gambaran besarnya! 
                  Sekarang hati-hati di detail."
   ```

6. **Build System Prompt**:
   ```
   [Standard tutor instructions]
   + [Tone for level 3]
   + [Logical reasoning format]
   + [Global structure]
   + [Impulsive tempo (60 words)]
   + [Personalized motivation]
   ```

7. **Call OpenRouter API**:
   ```
   Model: google/gemma-3-27b-it
   Prompt: [personalized system prompt]
   User Query: "Student said X, correct is Y. Feedback?"
   ```

8. **Return Feedback**:
   ```json
   {
     "feedback": "[Personalized 50-word feedback]",
     "profile": "3TGI",
     "timestamp": "2026-04-21T..."
   }
   ```

---

## 📈 EVALUATION DIMENSIONS (6-Point Rubric)

After quiz, users rate their experience on **10 dimensions** (5-point Likert scale for each):

| Dimension | Measures | Link to Personalization |
|-----------|----------|------------------------|
| **Accuracy Positive** | "AI detected my error correctly" | Modality/Processing fit |
| **Accuracy Negative** | "AI correction didn't match my error" | Validation that feedback was right |
| **Clarity Positive** | "Explanation very easy to understand" | Tempo/Modality fit |
| **Clarity Negative** | "I was confused, had to re-read" | Opposite of Clarity Positive |
| **Personalization Positive** | "AI style matched my learning" | ALL 4 dimensions tested |
| **Personalization Negative** | "AI style felt generic & stiff" | Validation of personalization |
| **Pacing Positive** | "Text length was just right" | Tempo fit |
| **Pacing Negative** | "Info was boring/too long" | Opposite of Pacing Positive |
| **Empowerment Positive** | "Felt more confident after" | Overall learning impact |
| **Empowerment Negative** | "Didn't help me understand better" | Overall learning impact |

**How to use**: Correlate ratings with profiles to validate personalization effectiveness.
- If 3TGI users rate "Clarity Positive" high but "Pacing Negative" high → adjust word limit
- If PAR profile rates "Personalization Negative" high → analogies not working

---

## 🎯 VALIDATION: How to Know It's Working

### ✅ Indicators of Good Personalization:

1. **Impulsive (I) users** see fast feedback (60 words avg) → High "Clarity Positive" rating
2. **Reflective (R) users** see detailed feedback (200 words avg) → High "Empowerment Positive" rating
3. **Text learners (T)** see formal logic → High "Personalization Positive" rating
4. **Picture learners (P)** see analogies → High "Personalization Positive" rating
5. **Global processors (G)** see big idea first → High "Clarity Positive" rating
6. **Analytic processors (A)** see step-by-step → High "Clarity Positive" rating

### ⚠️ Red Flags:

- All profiles get 3-4 on "Personalization Positive" → generic feedback
- Impulsive users complain about long text → word limit not enforced
- Tempo I ratings much lower than Tempo R → calibration issue
- Visual T ratings same as Visual P → modality rules not working

---

## 🔬 Research Foundation

This system is based on:

1. **Vygotsky's Zone of Proximal Development (ZPD)**
   - Level dimension: appropriate scaffolding for learner's current + potential ability

2. **Dunn & Dunn Learning Styles**
   - Visual (T/P): modality preference
   - Processing (G/A): cognitive organization preference

3. **Kagan's Cognitive Tempo**
   - Tempo (I/R): speed of processing & reflection tendency

4. **Cognitive Load Theory (Sweller)**
   - Tempo I: reduce extraneous load → shorter explanations
   - Tempo R: increase germane load → more scaffolding

5. **Instructional Design Best Practices**
   - Modality effect: match presentation mode to learner preference
   - Personalization effect: higher in real adaptive systems
   - Motivation: intrinsic through acknowledging learner's style

---

**Document Version**: 1.0
**Date**: April 21, 2026
**System**: AI Adaptive Deliberate Practice
