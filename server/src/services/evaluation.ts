// server/src/services/evaluationService.ts

import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const EVALUATION_MODEL = 'openai/gpt-5.2';

interface EvaluationRequest {
  profile: string;
  question: string;
  options: string[];
  correctAnswer: string;
  studentAnswer: string;
  aiFeedback: string;
  attempt?: number;
}

interface EvaluationResult {
  instructional_quality: number;
  specificity: number;
  clarity: number;
  motivational_tone: number;
  level_suitability: number;
  modality_alignment: number;
  structure_alignment: number;
  tempo_alignment: number;
  overall_cognitive_alignment: number;
  overall_average: number;
  strongest_dimension: string;
  weakest_dimension: string;
  learning_impact: string;
  raw_response: string;
}

const JUDGE_PROMPT_TEMPLATE = `
You are an expert evaluator of AI-generated educational feedback.

Your task is to evaluate ONLY the quality of the AI feedback.
Do NOT evaluate the question.

Focus on pedagogical effectiveness and alignment with the student profile.

Be analytical, fair, and evidence-based.

==================================================
PEDAGOGICAL FRAMEWORK
==================================================

This tutoring system follows the Zone of Proximal Development (ZPD).

In ZPD-based tutoring:

- Early feedback may provide hints instead of full explanations
- The tutor may guide attention toward the correct concept
- Productive struggle is intentional

Minimal hints are NOT poor feedback if they guide the learner toward the correct concept.

Do NOT penalize feedback for:
- not revealing the full answer
- using scaffolding hints
- encouraging the student to think further

Evaluate whether the feedback still supports conceptual understanding.

==================================================
STUDENT PROFILE
==================================================

Profile format: [Level][Modality][Structure][Tempo]

LEVEL (1–6)
1 Beginner
2 Basic
3 Intermediate
4 Proficient
5 Advanced
6 Expert

MODALITY
T = Text-oriented learner
P = Visual / analogy-oriented learner

STRUCTURE
G = Global thinker (big picture first)
A = Analytic thinker (step-by-step reasoning)

TEMPO
I = Impulsive learner (concise feedback)
R = Reflective learner (more elaborated explanation)

==================================================
CONTEXT
==================================================

Profile: {{PROFILE}}

Question:
{{QUESTION}}

Options:
{{OPTIONS}}

Student answer (WRONG): {{STUDENT_ANSWER}}
Correct answer: {{CORRECT_ANSWER}}

AI Feedback:
{{AI_FEEDBACK}}

==================================================
EVALUATION CRITERIA
==================================================

1. INSTRUCTIONAL QUALITY (1-5)
   - Evaluate whether the feedback helps move the student toward the correct concept.
   - In ZPD tutoring, this may occur through conceptual HINTS, guiding questions, or partial explanations.
   - Minimal hints are VALID if they guide the learner toward the correct concept.
   - 1 = Only states correct/incorrect without conceptual guidance
   - 3 = Provides some conceptual direction or hint
   - 5 = Effectively guides the learner toward the correct concept without necessarily giving away the full answer.

----
2. SPECIFICITY & ACTIONABILITY (1-5)
   - Does it relate to the student's chosen answer or the core concept tested?
   - Note: Because this is multiple choice, the student's internal reasoning is unknown.
   - Do NOT penalize the tutor for not knowing the student's hidden reasoning.
   - Evaluate if the feedback points to the specific concept that the student likely misunderstood.
   - 1 = Generic advice unrelated to the problem
   - 3 = References the concept but guidance is general
   - 5 = Clearly relates feedback to the chosen answer or the key concept being tested.
---

3. CLARITY & COHERENCE (1-5)

Is the explanation logically structured and easy to follow?

1 = Confusing or disorganized  
3 = Understandable but uneven  
5 = Clear structure and logical flow

---

4. MOTIVATIONAL TONE (1-5)

Is the feedback supportive and encourages learning?

1 = Harsh or discouraging  
3 = Neutral  
5 = Supportive and encourages improvement

---

5. LEVEL SUITABILITY (1-5)

Does the explanation match the student's expertise level?

Level 1–2 → simple explanations  
Level 3–4 → moderate reasoning  
Level 5–6 → deeper reasoning and technical terminology

1 = Major mismatch  
3 = Acceptable  
5 = Well calibrated

---

6. COGNITIVE ALIGNMENT

Evaluate three subdimensions.

MODALITY ALIGNMENT (1-5)

Text learners prefer logical explanations.
Visual learners benefit from analogies or conceptual imagery.

Evaluate overall explanation style rather than specific keywords.

---

STRUCTURE ALIGNMENT (1-5)

Global learners benefit from big-picture explanation first.
Analytic learners benefit from sequential reasoning.

Mixed approaches are acceptable if overall flow matches the preference.

---

TEMPO ALIGNMENT (1-5)

Impulsive learners prefer concise explanations.
Reflective learners benefit from deeper elaboration.

Do NOT judge strictly by word count.
Evaluate whether explanation style matches the tempo preference.

==================================================
OUTPUT FORMAT (JSON ONLY)
==================================================

{
"instructional_quality": <1-5>,
"specificity": <1-5>,
"clarity": <1-5>,
"motivational_tone": <1-5>,
"level_suitability": <1-5>,
"modality_alignment": <1-5>,
"structure_alignment": <1-5>,
"tempo_alignment": <1-5>,
"overall_cognitive_alignment": <average of modality, structure, tempo>,
"overall_average": <average of first five dimensions>,
"strongest_dimension": "<dimension>",
"weakest_dimension": "<dimension>",
"learning_impact": "<1-2 sentence assessment>"
}
`;

function buildEvaluationPrompt(req: EvaluationRequest): string {
  const optionsFormatted = req.options
    .map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`)
    .join('\n');

  return JUDGE_PROMPT_TEMPLATE
    .replace('{{PROFILE}}', req.profile)
    .replace('{{QUESTION}}', req.question)
    .replace('{{OPTIONS}}', optionsFormatted)
    .replace(/\{\{STUDENT_ANSWER\}\}/g, req.studentAnswer)
    .replace('{{CORRECT_ANSWER}}', req.correctAnswer)
    .replace('{{AI_FEEDBACK}}', req.aiFeedback);
}

export async function evaluateFeedback(req: EvaluationRequest): Promise<EvaluationResult> {
  const prompt = buildEvaluationPrompt(req);

  try {
    const response = await axios.post<any>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: EVALUATION_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data as any;
    const raw = data?.choices?.[0]?.message?.content || '';

    if (!raw) {
      throw new Error('No content in evaluation response');
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in evaluation response');
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return {
      instructional_quality: evaluation.instructional_quality || 3,
      specificity: evaluation.specificity || 3,
      clarity: evaluation.clarity || 3,
      motivational_tone: evaluation.motivational_tone || 3,
      level_suitability: evaluation.level_suitability || 3,
      modality_alignment: evaluation.modality_alignment || 3,
      structure_alignment: evaluation.structure_alignment || 3,
      tempo_alignment: evaluation.tempo_alignment || 3,
      overall_cognitive_alignment: evaluation.overall_cognitive_alignment || 3,
      overall_average: evaluation.overall_average || 3,
      strongest_dimension: evaluation.strongest_dimension || 'N/A',
      weakest_dimension: evaluation.weakest_dimension || 'N/A',
      learning_impact: evaluation.learning_impact || 'N/A',
      raw_response: raw
    };
  } catch (error: any) {
    console.error('❌ Evaluation error:', error.message);
    throw error;
  }
}