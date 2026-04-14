// server/src/controllers/feedbackController.ts

import { Request, Response, NextFunction } from 'express';
import { generateFeedback, generateDetailedWalkthrough } from '../services/openrouterService';

/**
 * POST /api/feedback
 * Generate AI feedback for student answer
 */
export async function getFeedback(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      questionText,
      questionTopic,
      userAnswer,
      correctAnswer,
      allOptions,
      isCorrect,
      attemptCount,
      userProfile,
      difficulty,
      imageDescription
    } = req.body;

    // Validation
    if (!questionText || !correctAnswer || !userAnswer || userProfile === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['questionText', 'correctAnswer', 'userAnswer', 'userProfile']
      });
    }

    console.log('📥 Feedback request received:');
    console.log(`   Profile: ${userProfile}`);
    console.log(`   Correct: ${isCorrect}`);
    console.log(`   Attempt: ${attemptCount}`);

    // Generate feedback using parametric profile system
    const feedback = await generateFeedback({
      questionText,
      questionTopic: questionTopic || 'General',
      userAnswer,
      correctAnswer,
      allOptions: allOptions || [],
      isCorrect: isCorrect === true || isCorrect === 'true',
      attemptCount: parseInt(attemptCount) || 1,
      userProfile: userProfile || '3TGI',
      difficulty: parseInt(difficulty) || 3,
      imageDescription
    });

    console.log('✅ Feedback generated successfully');

    res.json({
      success: true,
      feedback,
      profile: userProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in getFeedback:', error);
    next(error);
  }
}

/**
 * POST /api/feedback/explanation
 * Generate detailed walkthrough after correct answer
 */
export async function getExplanation(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      questionText,
      correctAnswer,
      allOptions,
      userProfile,
      imageDescription
    } = req.body;

    // Validation
    if (!questionText || !correctAnswer || !allOptions) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['questionText', 'correctAnswer', 'allOptions']
      });
    }

    console.log('📥 Explanation request received:');
    console.log(`   Profile: ${userProfile}`);
    console.log(`   Question: ${questionText.substring(0, 50)}...`);

    // Generate detailed walkthrough using parametric profile system
    const explanation = await generateDetailedWalkthrough({
      profileCode: userProfile || '3TGI',
      questionText,
      correctAnswer,
      allOptions,
      imageDescription
    });

    console.log('✅ Explanation generated successfully');

    res.json({
      success: true,
      explanation,
      profile: userProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in getExplanation:', error);
    next(error);
  }
}

export default {
  getFeedback,
  getExplanation
};