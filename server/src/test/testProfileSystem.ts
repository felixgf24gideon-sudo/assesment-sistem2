// server/src/test/testProfileSystem.ts

/**
 * Test script to verify parametric profile system
 * Run: npx ts-node src/test/testProfileSystem.ts
 */

import { 
  getAIStrategy, 
  getProfileDescription, 
  getAllProfileCodes,
  isValidProfileCode,
  parseProfileCode
} from '../config/profileSystem';

console.log('🧪 TESTING PARAMETRIC PROFILE SYSTEM\n');
console.log('='.repeat(60));

// Test 1: Parse profile codes
console.log('\n📝 TEST 1: Profile Code Parsing');
console.log('-'.repeat(60));

const testCodes = ['1TGI', '3TGI', '6PAR', 'invalid', '2PGR'];
testCodes.forEach(code => {
  const isValid = isValidProfileCode(code);
  console.log(`${code}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (isValid) {
    const params = parseProfileCode(code);
    console.log(`   Level: ${params.level}, Visual: ${params.visual}, Processing: ${params.processing}, Tempo: ${params.tempo}`);
    console.log(`   Description: ${getProfileDescription(code)}`);
  }
  console.log('');
});

// Test 2: Generate strategies for different profiles
console.log('\n🎯 TEST 2: AI Strategy Generation');
console.log('-'.repeat(60));

const sampleProfiles = ['1TGI', '3TGI', '6PAR'];
sampleProfiles.forEach(code => {
  console.log(`\n Profile: ${code}`);
  console.log(`   ${getProfileDescription(code)}`);
  
  const strategy = getAIStrategy(code);
  
  console.log('\n   Corrective Feedback:');
  console.log(`     Max Words: ${strategy.correctiveFeedback.maxWords}`);
  console.log(`     Opening: "${strategy.correctiveFeedback.openingPhrase}"`);
  console.log(`     Tone: ${strategy.correctiveFeedback.tone.substring(0, 50)}...`);
  
  console.log('\n   Positive Reinforcement:');
  console.log(`     Max Words: ${strategy.positiveReinforcement.maxWords}`);
  console.log(`     Praise: "${strategy.positiveReinforcement.praiseStyle}"`);
  
  console.log('\n   Detailed Walkthrough:');
  console.log(`     Max Words: ${strategy.detailedWalkthrough.maxWords}`);
  console.log(`     Approach: ${strategy.detailedWalkthrough.approach.substring(0, 50)}...`);
  
  console.log('\n   ' + '─'.repeat(58));
});

// Test 3: Coverage test
console.log('\n\n📊 TEST 3: Profile Coverage');
console.log('-'.repeat(60));

const allCodes = getAllProfileCodes();
console.log(`Total profiles: ${allCodes.length} (expected: 48)`);
console.log(`All valid: ${allCodes.every(code => isValidProfileCode(code)) ? '✅ YES' : '❌ NO'}`);

console.log('\nSample profile codes (first 10):');
allCodes.slice(0, 10).forEach(code => console.log(`  - ${code}`));

// Test 4: Edge cases
console.log('\n\n🔬 TEST 4: Edge Cases');
console.log('-'.repeat(60));

console.log('\nExtreme profiles:');
const extremes = ['1TGI', '1TAR', '6TGI', '6PAR'];
extremes.forEach(code => {
  const strategy = getAIStrategy(code);
  console.log(`\n${code}:`);
  console.log(`  Corrective: ${strategy.correctiveFeedback.maxWords} words`);
  console.log(`  Positive: ${strategy.positiveReinforcement.maxWords} words`);
  console.log(`  Walkthrough: ${strategy.detailedWalkthrough.maxWords} words`);
});

// Test 5: Consistency check
console.log('\n\n🔍 TEST 5: Consistency Check');
console.log('-'.repeat(60));

console.log('\nWord limit ranges by tempo:');
const impulsiveProfiles = allCodes.filter(c => c[3] === 'I');
const reflectiveProfiles = allCodes.filter(c => c[3] === 'R');

const impulsiveLimits = impulsiveProfiles.map(c => getAIStrategy(c).correctiveFeedback.maxWords);
const reflectiveLimits = reflectiveProfiles.map(c => getAIStrategy(c).correctiveFeedback.maxWords);

console.log(`  Impulsive (I): ${Math.min(...impulsiveLimits)}-${Math.max(...impulsiveLimits)} words`);
console.log(`  Reflective (R): ${Math.min(...reflectiveLimits)}-${Math.max(...reflectiveLimits)} words`);
console.log(`  ✅ Impulsive < Reflective: ${Math.max(...impulsiveLimits) < Math.min(...reflectiveLimits) ? 'YES' : 'NO'}`);

console.log('\n' + '='.repeat(60));
console.log('✅ ALL TESTS COMPLETE!\n');