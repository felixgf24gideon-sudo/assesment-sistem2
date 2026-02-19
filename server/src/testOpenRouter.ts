// server/src/testOpenRouter.ts
import dotenv from 'dotenv';
import { generateCorrectiveFeedback, generateExplanation } from './services/openrouterService';

dotenv.config();

async function test() {
  console.log('🧪 Testing OpenRouter API...\n');

  // Test 1: Corrective feedback
  console.log('📝 Test 1: Generate corrective feedback (wrong answer)');
  try {
    const feedback = await generateCorrectiveFeedback({
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
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Explanation
  console.log('📝 Test 2: Generate explanation (correct answer)');
  try {
    const explanation = await generateExplanation({
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
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }
}

test();