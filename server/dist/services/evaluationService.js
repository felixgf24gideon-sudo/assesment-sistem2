"use strict";
// server/src/services/evaluationService.ts
// REFINED RUBRIC: 6 Dimensi Personalisasi-Centric
// Fokus: Mengukur efek personalisasi, bukan hanya kualitas generik
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateFeedback = evaluateFeedback;
const axios_1 = __importDefault(require("axios"));
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EVALUATION_MODEL = 'google/gemini-3-flash-preview';
function parseProfile(profileCode) {
    return {
        level: parseInt(profileCode[0]),
        modality: profileCode[1],
        structure: profileCode[2],
        tempo: profileCode[3]
    };
}
function calculateWordCount(text) {
    return text.trim().split(/\s+/).length;
}
function buildRefinedContext(profileCode, wordCount) {
    const profile = parseProfile(profileCode);
    const { level, modality, structure, tempo } = profile;
    return `
===== REFINED EVALUATION CONTEXT =====

Student Profile:
- Level: ${level} (${level <= 2 ? 'Beginner' : level <= 4 ? 'Intermediate' : 'Advanced'})
- Modality: ${modality === 'T' ? 'TEXT/LOGIC (prefers sequential reasoning)' : 'VISUAL/ANALOGY (prefers imagery & metaphors)'}
- Structure: ${structure === 'G' ? 'GLOBAL (needs big picture first)' : 'ANALYTIC (needs step-by-step)'}
- Tempo: ${tempo === 'I' ? 'IMPULSIVE (values speed, gets overloaded)' : 'REFLECTIVE (values depth, needs elaboration)'}

Feedback Metrics:
- Word Count: ${wordCount} words
- For Impulsive learners: Ideal 30-100w | Acceptable <150w | Too Long >150w | FAIL >250w
- For Reflective learners: Ideal 150-300w | Acceptable 100-150w | Too Brief <100w | FAIL <50w

===== KEY PRINCIPLE =====

Personalization is NOT about giving more information.
Personalization is about giving the RIGHT information,
in the RIGHT format,
at the RIGHT pace,
for THIS specific learner.

Scoring is STRICT on profile mismatch:
- If TREATMENT claims personalization but has Tempo/Modality mismatch → Max score 2/5
- If CONTROL is generic but happens to work → Score based on content only (no personalization bonus)
`;
}
function buildRefinedCriteria(profileCode, experimentGroup, wordCount, attempt) {
    const profile = parseProfile(profileCode);
    const context = buildRefinedContext(profileCode, wordCount);
    const dimensionInstructions = `
${context}


═══════════════════════════════════════════════════════════════
A score of 5/5 represents "Perfection and Insightfulness". 
It should be RARE. 
If the feedback is "just good and follows instructions", it is a 4/5. 
Reserve 5/5 only for feedback that shows exceptional pedagogical creativity 
or perfectly seamless integration of the student's profile.
═══════════════════════════════════════════════════════════════

DIMENSION 1: INSTRUCTIONAL QUALITY (Targeted & Precise)
═══════════════════════════════════════════════════════════════

Definition: Does the feedback surgically identify THE SPECIFIC misconception 
and guide toward correction WITHOUT information dumping?

Key Question: What is the Signal-to-Noise ratio? 
Is every word serving pedagogical purpose, or is some text "filler"?

5/5 - SURGICAL PRECISION
  ✓ Exact error identified in 1-2 sentences
  ✓ Root cause analysis is immediate and actionable
  ✓ Zero padding; high signal-to-noise ratio
  ✓ Example: "You chose A because you forgot X. Actually, Y happens instead."

4/5 - TARGETED
  ✓ Error clearly identified with minimal context
  ✓ Mostly actionable with little re-reading needed

3/5 - ADEQUATE BUT PADDED
  ✓ Error identification exists but surrounded by generic explanation
  ✓ Reader must extract signal from background noise

2/5 - BURIED ERROR
  ✓ Specific diagnosis hidden in 5+ sentences
  ✗ Information Dumping detected
  ✗ Reader exhausted before finding actionable part

1/5 - GENERIC/MISSING
  ✓ No specific diagnosis; only general advice
  ✓ Could apply to any wrong answer

PENALTY RULE FOR INFORMATION DUMPING:
If word_count > baseline_for_complexity AND 
   error_diagnosis_is_<25% of feedback_length:
  → Maximum score: 3/5

Scoring Guidance: Provide your score (1-5) and reasoning (1-2 sentences).

───────────────────────────────────────────────────────────────

DIMENSION 2: CLARITY & PRACTICALITY
───────────────────────────────────────────────────────────────

Definition: Is the feedback IMMEDIATELY UNDERSTANDABLE and likely to be 
READ COMPLETELY by the student?

Key Question: What is the likelihood this student ACTUALLY READS this to the end?
Not: "Is it theoretically clear?"
But: "Would THIS learner complete reading this, or abandon it?"

5/5 - INSTANT & COMPLETE READABILITY
  ✓ Core message grasped in first 2 sentences
  ✓ Read time: <1 minute
  ✓ Likelihood to read complete: >90%
  ✓ No cognitive burden

4/5 - VERY READABLE
  ✓ Clear within first paragraph
  ✓ Read time: 1-2 minutes
  ✓ Likelihood to read complete: >75%

3/5 - ACCEPTABLE CLARITY
  ✓ Understandable but requires attention
  ✓ Read time: 2-3 minutes
  ✓ Likelihood to read complete: 50-75%

2/5 - COGNITIVE EFFORT REQUIRED
  ✓ Reader must re-read parts
  ✓ Read time: 3-5 minutes
  ✓ Likelihood to read complete: 25-50%

1/5 - NOT PRACTICAL
  ✓ Dense, overwhelming, poorly structured
  ✓ Read time: >5 minutes
  ✓ Likelihood to read complete: <25%

HARD RULES:
- If word_count > 250 AND problem complexity is "simple": → Maximum score: 3/5
- If word_count > 400 regardless of complexity: → Maximum score: 2/5

Scoring Guidance: Provide your score (1-5) and reasoning (1-2 sentences).

───────────────────────────────────────────────────────────────

DIMENSION 3: MODALITY ALIGNMENT (Cognitive)
───────────────────────────────────────────────────────────────

Definition: Does the explanation STYLE match this student's cognitive preference?

Context:
- Text (T): Prefers logical sequences, formal language, mathematical reasoning
- Visual (P): Prefers analogies, metaphors, conceptual imagery, storytelling

5/5 - EXCEPTIONAL INTEGRATION
  ✓ For Visual (P): Must use a DEEP analogy that is central to the explanation. 
  ✓ If it only uses a simple metaphor or a few visual words, it is a 4/5.

4/5 - GOOD FIT
  ✓ Mostly aligned, minor deviation

3/5 - NEUTRAL/MIXED
  ✓ Neither strongly aligned nor misaligned
  ✓ Works but not optimized

2/5 - MISALIGNED
  ✓ Logic-heavy for Visual learner (they need analogies)
  ✓ Analogy-heavy for Text learner (they need formalism)

1/5 - STRONGLY MISALIGNED
  ✓ Fundamentally wrong modality approach

CRITICAL RULE FOR TREATMENT:
If feedback claims PERSONALIZATION and modality is mismatched: → CANNOT score >2/5

Scoring Guidance: Provide your score (1-5) and reasoning (1-2 sentences).

───────────────────────────────────────────────────────────────

DIMENSION 4: STRUCTURE ALIGNMENT (Cognitive)
───────────────────────────────────────────────────────────────

Definition: Does the explanation FLOW match this student's thinking structure?

Context:
- Global (G): Needs big-picture context FIRST, then zoom into details
- Analytic (A): Needs step-by-step progression from foundation to conclusion

5/5 - NATURAL FLOW
  ✓ The flow must feel like a natural conversation, not just a labeled structure.
  ✓ If it feels slightly "robotic" despite being correct, it is a 4/5.

4/5 - GOOD STRUCTURE
  ✓ Mostly aligned with minor deviations

3/5 - NEUTRAL
  ✓ Neither strongly hierarchical nor sequential

2/5 - MISALIGNED
  ✓ Global learner gets: "First term X... Then Y... Finally Z..." (no overall context)
  ✓ Analytic learner gets: "The concept is..." (no step-by-step breakdown)

1/5 - FRUSTRATING STRUCTURE
  ✓ Actively fights learner's natural thinking style

CRITICAL RULE FOR TREATMENT:
If feedback claims PERSONALIZATION and structure is mismatched: → CANNOT score >2/5

Scoring Guidance: Provide your score (1-5) and reasoning (1-2 sentences).

───────────────────────────────────────────────────────────────

DIMENSION 5: TEMPO ALIGNMENT (Cognitive) 🚨 STRICTEST DIMENSION
───────────────────────────────────────────────────────────────

Definition: Does the PACING and LENGTH match this learner's processing speed?

⚠️ THIS IS THE MOST CRITICAL DIMENSION FOR PERSONALIZATION ⚠️

HARD RULES (Non-negotiable):

FOR IMPULSIVE (I) LEARNERS:
  ✓ Ideal: 30-100 words (matches quick-thinking style)
  ✓ 100-150 words: Max score 4/5 (acceptable, slightly verbose)
  ✓ 150-250 words: Max score 2/5 (TOO LONG, cognitive overload)
  ✗ >250 words: Max score 1/5 (PEDAGOGICAL FAILURE - student will skip)

FOR REFLECTIVE (R) LEARNERS:
  ✓ Ideal: 150-300 words (supports deliberate thinking)
  ✓ 100-150 words: Max score 4/5 (acceptable but could elaborate)
  ✓ 50-100 words: Max score 2/5 (TOO BRIEF, insufficient scaffolding)
  ✗ <50 words: Max score 1/5 (CRYPTIC - student feels abandoned)

5/5 - PERFECT TEMPO
  ✓ Pacing feels natural for this learner
  ✓ Every word matters; no filler
  ✓ Word count matches profile needs

4/5 - GOOD TEMPO
  ✓ Slightly off but tolerable
  ✓ Student will still engage

3/5 - ACCEPTABLE MISMATCH
  ✓ Impulsive gets ~120w (bit long but manageable)
  ✓ Reflective gets ~120w (bit brief but comprehensible)

2/5 - SIGNIFICANT MISMATCH
  ✓ Violates soft thresholds
  ✓ Impulsive: 200+ words (will likely abandon)
  ✓ Reflective: 60 words (feels rushed)

1/5 - CRITICAL MISMATCH
  ✓ Violates hard thresholds
  ✓ Impulsive: >250 words (guaranteed skip)
  ✓ Reflective: <50 words (too cryptic)

Scoring Guidance: Provide your score (1-5) and reasoning (1-2 sentences including word count assessment).

───────────────────────────────────────────────────────────────

DIMENSION 6: PERSONALIZED MOTIVATION (Affective)
───────────────────────────────────────────────────────────────

Definition: Is the encouragement SPECIFICALLY TAILORED to this learner's 
cognitive style, or just generic compliments?

Key Question: Does the motivation reference something SPECIFIC about 
this learner's approach/style, or could it apply to any student?

5/5 - CONTEXTUAL AFFIRMATION
  ✓ MUST reference the specific concept of the question AND the student's style.
  ✓ If the praise is just about the style (e.g., "Good job being quick!") 
    without linking it to the topic, it is a 4/5.
  
  Examples (Impulsive):
    "Nice catch! Your quick thinking got you halfway there..."
    "I like your speed. Now slow down and check step X..."
  
  Examples (Reflective):
    "You clearly took time here. Let me help refine your approach..."
    "Your methodical thinking is solid, but there's one missing piece..."
  
  Examples (Analytic):
    "Excellent step-by-step reasoning. Where it breaks: step 3..."
  
  Examples (Global):
    "You understand the big picture. Now let's zoom into..."

4/5 - SEMI-PERSONALIZED
  ✓ Motivation acknowledges effort or approach generally
  ✓ Example: "Good thinking. Here's a refinement..."

3/5 - NEUTRAL ENCOURAGEMENT
  ✓ Supportive but generic
  ✓ Example: "Keep trying! Here's why..."

2/5 - GENERIC PRAISE
  ✓ Example: "Good job! Try again!"
  ✓ Could apply to ANY student regardless of profile

1/5 - DISMISSIVE
  ✓ Example: "That's wrong. Here's the answer."
  ✓ Zero personalization; feels impersonal

CRITICAL RULE FOR TREATMENT:
If feedback claims PERSONALIZATION but motivation is completely generic:
  → CANNOT score >3/5 on this dimension

Scoring Guidance: Provide your score (1-5) and reasoning (1-2 sentences).

═══════════════════════════════════════════════════════════════
`;
    return dimensionInstructions;
}
const JUDGE_PROMPT_BASE = `
You are an Expert Pedagogical Evaluator specializing in Adaptive Learning Systems.

Your task: Evaluate feedback using 6 dimensions designed to measure PERSONALIZATION EFFECT.

⚠️ CRITICAL PRINCIPLE:
High scores are EARNED through personalization, NOT by content verbosity.
Longer feedback ≠ Better feedback. Appropriateness ≠ Volume.

═══════════════════════════════════════════════════════════════

CORE EVALUATION PRINCIPLE:

Personalization means:
- RIGHT information (relevant to this specific error)
- RIGHT format (matching this learner's modality)
- RIGHT pace (matching this learner's tempo)
- RIGHT encouragement (reflecting this learner's style)

NOT "more information" or "more detail"

═══════════════════════════════════════════════════════════════

CONTEXT:

Question:
{{QUESTION}}

Options:
{{OPTIONS}}

Student's Wrong Answer: {{STUDENT_ANSWER}}
Correct Answer: {{CORRECT_ANSWER}}

Feedback to Evaluate:
"{{AI_FEEDBACK}}"

Word Count: {{WORD_COUNT}} words

{{REFINED_CRITERIA}}

═══════════════════════════════════════════════════════════════

OUTPUT FORMAT (JSON ONLY):

{
  "instructional_quality": <1-5>,
  "instructional_reasoning": "<Does it have surgical precision or is it padded?>",
  
  "clarity_and_practicality": <1-5>,
  "clarity_reasoning": "<What's the likelihood student reads to end? Cognitive load OK?>",
  
  "modality_alignment": <1-5>,
  "modality_reasoning": "<Does this match Text/Logic OR Visual/Analogy preference?>",
  
  "structure_alignment": <1-5>,
  "structure_reasoning": "<Does flow match Global (big picture first) OR Analytic (step-by-step)?>",
  
  "tempo_alignment": <1-5>,
  "tempo_reasoning": "<HARD RULES: For this profile at this word count, score violates threshold?>",
  
  "personalized_motivation": <1-5>,
  "motivation_reasoning": "<Is encouragement specific to this learner's style, or generic?>",
  
  "overall_personalization_score": <average of 6 dimensions>,
  "strongest_dimension": "<which scored highest>",
  "weakest_dimension": "<which scored lowest>",
  
  "critical_failures": "<ONLY IF TREATMENT: describe any serious personalization failures>",
  
  "learning_impact": "<1-2 sentences: Will this actually help this specific learner?>"
}

Return ONLY valid JSON. No explanation, no code blocks.
`;
function buildRefinedEvaluationPrompt(req) {
    const optionsFormatted = req.options
        .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`)
        .join('\n');
    const attempt = req.attempt || 1;
    const experimentGroup = req.experimentGroup || 'control';
    const wordCount = calculateWordCount(req.aiFeedback);
    const criteria = buildRefinedCriteria(req.profile, experimentGroup, wordCount, attempt);
    return JUDGE_PROMPT_BASE.replace('{{QUESTION}}', req.question)
        .replace('{{OPTIONS}}', optionsFormatted)
        .replace(/\{\{STUDENT_ANSWER\}\}/g, req.studentAnswer)
        .replace('{{CORRECT_ANSWER}}', req.correctAnswer)
        .replace('{{AI_FEEDBACK}}', req.aiFeedback)
        .replace('{{WORD_COUNT}}', wordCount.toString())
        .replace('{{REFINED_CRITERIA}}', criteria);
}
function validateScore(value, defaultValue = 3) {
    const num = Number(value);
    if (isNaN(num))
        return defaultValue;
    return Math.max(1, Math.min(5, num));
}
async function evaluateFeedback(req) {
    const prompt = buildRefinedEvaluationPrompt(req);
    const wordCount = calculateWordCount(req.aiFeedback);
    try {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: EVALUATION_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.35,
            max_tokens: 2500
        }, {
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const data = response.data;
        const raw = data?.choices?.[0]?.message?.content || '';
        if (!raw) {
            throw new Error('No content in evaluation response');
        }
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in evaluation response');
        }
        const evaluation = JSON.parse(jsonMatch[0]);
        // Extract and validate 6 core dimensions
        const instructionalQuality = validateScore(evaluation.instructional_quality);
        const clarityAndPracticality = validateScore(evaluation.clarity_and_practicality);
        const modalityAlignment = validateScore(evaluation.modality_alignment);
        const structureAlignment = validateScore(evaluation.structure_alignment);
        const tempoAlignment = validateScore(evaluation.tempo_alignment);
        const personalizedMotivation = validateScore(evaluation.personalized_motivation);
        // Calculate overall personalization score
        const overallPersonalizationScore = (instructionalQuality +
            clarityAndPracticality +
            modalityAlignment +
            structureAlignment +
            tempoAlignment +
            personalizedMotivation) /
            6;
        // Find strongest and weakest
        const scores = [
            { name: 'Instructional Quality', value: instructionalQuality },
            { name: 'Clarity & Practicality', value: clarityAndPracticality },
            { name: 'Modality Alignment', value: modalityAlignment },
            { name: 'Structure Alignment', value: structureAlignment },
            { name: 'Tempo Alignment', value: tempoAlignment },
            { name: 'Personalized Motivation', value: personalizedMotivation }
        ];
        const strongest = scores.reduce((a, b) => (a.value > b.value ? a : b));
        const weakest = scores.reduce((a, b) => (a.value < b.value ? a : b));
        return {
            instructional_quality: instructionalQuality,
            instructional_reasoning: evaluation.instructional_reasoning || 'No reasoning provided',
            clarity_and_practicality: clarityAndPracticality,
            clarity_reasoning: evaluation.clarity_reasoning || 'No reasoning provided',
            modality_alignment: modalityAlignment,
            modality_reasoning: evaluation.modality_reasoning || 'No reasoning provided',
            structure_alignment: structureAlignment,
            structure_reasoning: evaluation.structure_reasoning || 'No reasoning provided',
            tempo_alignment: tempoAlignment,
            tempo_reasoning: evaluation.tempo_reasoning || 'No reasoning provided',
            personalized_motivation: personalizedMotivation,
            motivation_reasoning: evaluation.motivation_reasoning || 'No reasoning provided',
            overall_personalization_score: overallPersonalizationScore,
            strongest_dimension: strongest.name,
            weakest_dimension: weakest.name,
            critical_failures: evaluation.critical_failures || '',
            learning_impact: evaluation.learning_impact || 'N/A',
            raw_response: raw,
            word_count: wordCount
        };
    }
    catch (error) {
        console.error('❌ Evaluation error:', error.message);
        throw error;
    }
}
