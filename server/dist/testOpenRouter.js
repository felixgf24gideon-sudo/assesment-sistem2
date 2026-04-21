"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/testOpenRouter.ts
const dotenv_1 = __importDefault(require("dotenv"));
const openrouterService_1 = require("./services/openrouterService");
dotenv_1.default.config();
async function test() {
    console.log('🧪 Testing OpenRouter API...\n');
    // Test 1: Corrective feedback
    console.log('📝 Test 1: Generate corrective feedback (wrong answer)');
    try {
        const feedback = await (0, openrouterService_1.generateCorrectiveFeedback)({
            profileCode: '3TGI',
            pedagogicLevel: 3,
            visualPreference: 'T',
            processingOrientation: 'G',
            behavioralTempo: 'I',
            questionText: 'What is the time complexity of binary search on a sorted array?',
            correctAnswer: 'O(log n)',
            studentAnswer: 'O(n)',
            attemptNumber: 1,
        });
        console.log('✅ Feedback generated:');
        console.log(`   "${feedback}"\n`);
    }
    catch (error) {
        console.error('❌ Test 1 failed:', error);
    }
    // Test 2: Explanation
    console.log('📝 Test 2: Generate explanation (correct answer)');
    try {
        const explanation = await (0, openrouterService_1.generateExplanation)({
            profileCode: '3TGI',
            pedagogicLevel: 3,
            visualPreference: 'T',
            processingOrientation: 'G',
            behavioralTempo: 'I',
            questionText: 'What is the time complexity of binary search on a sorted array?',
            correctAnswer: 'O(log n)',
            attemptNumber: 2,
        });
        console.log('✅ Explanation generated:');
        console.log(`   "${explanation}"\n`);
    }
    catch (error) {
        console.error('❌ Test 2 failed:', error);
    }
}
test();
