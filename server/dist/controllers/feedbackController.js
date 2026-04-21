"use strict";
// server/src/controllers/feedbackController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedback = getFeedback;
exports.getExplanation = getExplanation;
const openrouterService_1 = require("../services/openrouterService");
/**
 * POST /api/feedback
 * Generate AI feedback for student answer
 */
async function getFeedback(req, res, next) {
    try {
        const { questionText, questionTopic, userAnswer, correctAnswer, allOptions, isCorrect, attemptCount, userProfile, difficulty, imageDescription } = req.body;
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
        const feedback = await (0, openrouterService_1.generateFeedback)({
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
    }
    catch (error) {
        console.error('❌ Error in getFeedback:', error);
        next(error);
    }
}
/**
 * POST /api/feedback/explanation
 * Generate detailed walkthrough after correct answer
 */
async function getExplanation(req, res, next) {
    try {
        const { questionText, correctAnswer, allOptions, userProfile, imageDescription } = req.body;
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
        const explanation = await (0, openrouterService_1.generateDetailedWalkthrough)({
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
    }
    catch (error) {
        console.error('❌ Error in getExplanation:', error);
        next(error);
    }
}
exports.default = {
    getFeedback,
    getExplanation
};
