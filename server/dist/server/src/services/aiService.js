"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFeedback = generateFeedback;
const openai_1 = __importDefault(require("openai"));
const promptBuilder_1 = require("./promptBuilder");
let openai = null;
function getOpenAIClient() {
    if (!openai) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        openai = new openai_1.default({ apiKey });
    }
    return openai;
}
function getFallbackFeedback(request) {
    if (request.isCorrect) {
        return "Correct! Well done.";
    }
    return `Not quite. The correct answer is ${request.correctAnswer}. Review and try again.`;
}
async function generateFeedback(request) {
    const { systemPrompt, userPrompt } = (0, promptBuilder_1.buildFeedbackPrompt)(request);
    try {
        const client = getOpenAIClient();
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 60,
            temperature: 0.5
        }, {
            timeout: 3000
        });
        return completion.choices[0].message.content?.trim() || "Try again.";
    }
    catch (error) {
        console.error('AI feedback generation failed:', error);
        return getFallbackFeedback(request);
    }
}
//# sourceMappingURL=aiService.js.map