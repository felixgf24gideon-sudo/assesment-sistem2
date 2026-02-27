// server/src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';

export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { questionText, userAnswer, correctAnswer, isCorrect, attemptCount } = req.body;

  // Only validate truly required fields
  if (!questionText || userAnswer === undefined || correctAnswer === undefined) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['questionText', 'userAnswer', 'correctAnswer']
    });
    return;
  }

  // isCorrect and attemptCount should be present
  if (typeof isCorrect !== 'boolean' || typeof attemptCount !== 'number') {
    res.status(400).json({
      error: 'Invalid field types',
      details: 'isCorrect must be boolean, attemptCount must be number'
    });
    return;
  }

  // userProfile is OPTIONAL (will default to '3TGI' in controller)
  console.log('✅ Request validation passed');
  next();
}