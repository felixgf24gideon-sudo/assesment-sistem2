import OpenAI from 'openai';
import { FeedbackRequest } from '../../../shared/types';
import { buildFeedbackPrompt } from './promptBuilder';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

function getFallbackFeedback(request: FeedbackRequest): string {
  if (request.isCorrect) {
    return "Correct! Well done.";
  }
  return `Not quite. The correct answer is ${request.correctAnswer}. Review and try again.`;
}

export async function generateFeedback(request: FeedbackRequest): Promise<string> {
  const { systemPrompt, userPrompt } = buildFeedbackPrompt(request);

  try {
    const client = getOpenAIClient();
    
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 60,
      temperature: 0.5,
      timeout: 3000
    });

    return completion.choices[0].message.content?.trim() || "Try again.";
  } catch (error) {
    console.error('AI feedback generation failed:', error);
    return getFallbackFeedback(request);
  }
}
