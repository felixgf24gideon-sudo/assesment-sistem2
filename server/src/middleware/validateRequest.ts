import { Request, Response, NextFunction } from 'express';

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const { profileCode, questionId, selectedAnswer, attemptNumber } = req.body;

  if (!profileCode || typeof profileCode !== 'string') {
    return res.status(400).json({ error: 'Profile code is required' });
  }

  const profileRegex = /^[1-6][TP][GA][IR]$/;
  if (!profileRegex.test(profileCode)) {
    return res.status(400).json({ error: 'Invalid profile code format' });
  }

  if (!questionId || typeof questionId !== 'string') {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  if (typeof selectedAnswer !== 'number' || selectedAnswer < 0) {
    return res.status(400).json({ error: 'Valid selected answer is required' });
  }

  if (typeof attemptNumber !== 'number' || attemptNumber < 1) {
    return res.status(400).json({ error: 'Valid attempt number is required' });
  }

  next();
}
