"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedback = getFeedback;
const aiService_1 = require("../services/aiService");
const questions_1 = require("../../../shared/questions");
function parseProfileCode(code) {
    return {
        level: parseInt(code[0]),
        style: {
            visualPreference: code[1],
            processingOrientation: code[2],
            behavioralTempo: code[3]
        }
    };
}
async function getFeedback(req, res) {
    try {
        const { profileCode, questionId, selectedAnswer, attemptNumber } = req.body;
        const question = questions_1.questions.find(q => q.id === questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const isCorrect = selectedAnswer === question.correctAnswer;
        const profile = parseProfileCode(profileCode);
        const feedbackRequest = {
            profileCode,
            pedagogicalLevel: profile.level,
            attemptNumber,
            questionText: question.text,
            correctAnswer: question.options[question.correctAnswer],
            studentAnswer: question.options[selectedAnswer],
            isCorrect,
            cognitiveStyle: profile.style
        };
        const feedback = await (0, aiService_1.generateFeedback)(feedbackRequest);
        res.json({
            feedback,
            isCorrect
        });
    }
    catch (error) {
        console.error('Feedback controller error:', error);
        res.status(500).json({ error: 'Failed to generate feedback' });
    }
}
//# sourceMappingURL=feedbackController.js.map