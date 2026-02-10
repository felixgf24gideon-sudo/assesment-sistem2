import { Request, Response } from 'express';
import { generateFeedback } from '../services/aiService';
import { FeedbackRequest, CognitiveStyle } from '../../../shared/types';
import { questions } from '../../../shared/questions';

function parseProfileCode(code: string): { level: number; style: CognitiveStyle } {
  return {
    level: parseInt(code[0]),
    style: {
      visualPreference: code[1] as 'T' | 'P',
      processingOrientation: code[2] as 'G' | 'A',
      behavioralTempo: code[3] as 'I' | 'R'
    }
  };
}

export async function getFeedback(req: Request, res: Response) {
  try {
    const { profileCode, questionId, selectedAnswer, attemptNumber } = req.body;

    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    const profile = parseProfileCode(profileCode);

    const feedbackRequest: FeedbackRequest = {
      profileCode,
      pedagogicalLevel: profile.level,
      attemptNumber,
      questionText: question.text,
      correctAnswer: question.options[question.correctAnswer],
      studentAnswer: question.options[selectedAnswer],
      isCorrect,
      cognitiveStyle: profile.style
    };

    const feedback = await generateFeedback(feedbackRequest);

    res.json({
      feedback,
      isCorrect
    });
  } catch (error) {
    console.error('Feedback controller error:', error);
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
}
