"use strict";
// server/src/scripts/generateDataset.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabase_js_1 = require("@supabase/supabase-js");
const openrouterService_1 = require("./services/openrouterService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// All 48 profiles
const ALL_PROFILES = [
    '1TGI', '1TGR', '1TAI', '1TAR', '1PGI', '1PGR', '1PAI', '1PAR',
    '2TGI', '2TGR', '2TAI', '2TAR', '2PGI', '2PGR', '2PAI', '2PAR',
    '3TGI', '3TGR', '3TAI', '3TAR', '3PGI', '3PGR', '3PAI', '3PAR',
    '4TGI', '4TGR', '4TAI', '4TAR', '4PGI', '4PGR', '4PAI', '4PAR',
    '5TGI', '5TGR', '5TAI', '5TAR', '5PGI', '5PGR', '5PAI', '5PAR',
    '6TGI', '6TGR', '6TAI', '6TAR', '6PGI', '6PGR', '6PAI', '6PAR'
];
// Utility: Count words
function countWords(text) {
    return text.trim().split(/\s+/).length;
}
// Utility: Delay to avoid rate limits
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function fetchQuestions() {
    console.log('📥 Fetching questions from database...');
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('id');
    if (error) {
        console.error('❌ Error fetching questions:', error);
        throw error;
    }
    console.log(`✅ Found ${data.length} questions`);
    return data;
}
async function generateDataset() {
    console.log('🚀 Starting Dataset Generation...\n');
    console.log(`📊 Target: ${ALL_PROFILES.length} profiles × questions × 3 scenarios\n`);
    const questions = await fetchQuestions();
    const dataset = [];
    let totalProcessed = 0;
    const totalItems = ALL_PROFILES.length * questions.length * 3;
    const startTime = Date.now();
    // Loop through each profile
    for (const profile of ALL_PROFILES) {
        console.log(`\n🎯 Processing Profile: ${profile}`);
        console.log('═'.repeat(60));
        // Loop through each question
        for (const question of questions) {
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const correctAnswerText = `${letters[question.correct_answer]}. ${question.options[question.correct_answer]}`;
            // Pick a wrong answer (first option that's not correct)
            const wrongAnswerIndex = question.correct_answer === 0 ? 1 : 0;
            const wrongAnswerText = `${letters[wrongAnswerIndex]}. ${question.options[wrongAnswerIndex]}`;
            console.log(`\n📝 Question: ${question.text.substring(0, 60)}...`);
            // ========== SCENARIO 1: Corrective Feedback (Attempt 1) ==========
            try {
                console.log('   🔄 Generating: Corrective Feedback (Attempt 1)...');
                const feedback1 = await (0, openrouterService_1.generateCorrectiveFeedback)({
                    profileCode: profile,
                    questionText: question.text,
                    correctAnswer: correctAnswerText,
                    studentAnswer: wrongAnswerText,
                    attemptNumber: 1
                });
                dataset.push({
                    profile_code: profile,
                    question_id: question.id,
                    question_text: question.text,
                    question_topic: question.topic,
                    difficulty: question.difficulty,
                    correct_answer: correctAnswerText,
                    user_answer: wrongAnswerText,
                    scenario_type: 'corrective_feedback_attempt_1',
                    attempt_number: 1,
                    ai_response: feedback1,
                    response_word_count: countWords(feedback1),
                    timestamp: new Date().toISOString()
                });
                totalProcessed++;
                console.log(`   ✅ Done (${totalProcessed}/${totalItems}) - ${countWords(feedback1)} words`);
                await delay(1000); // 1 second delay to avoid rate limits
            }
            catch (error) {
                console.error(`   Error: ${error.message}`);
            }
            // ========== SCENARIO 2: Corrective Feedback (Attempt 2) ==========
            try {
                console.log('   🔄 Generating: Corrective Feedback (Attempt 2)...');
                const feedback2 = await (0, openrouterService_1.generateCorrectiveFeedback)({
                    profileCode: profile,
                    questionText: question.text,
                    correctAnswer: correctAnswerText,
                    studentAnswer: wrongAnswerText,
                    attemptNumber: 2
                });
                dataset.push({
                    profile_code: profile,
                    question_id: question.id,
                    question_text: question.text,
                    question_topic: question.topic,
                    difficulty: question.difficulty,
                    correct_answer: correctAnswerText,
                    user_answer: wrongAnswerText,
                    scenario_type: 'corrective_feedback_attempt_2',
                    attempt_number: 2,
                    ai_response: feedback2,
                    response_word_count: countWords(feedback2),
                    timestamp: new Date().toISOString()
                });
                totalProcessed++;
                console.log(`   ✅ Done (${totalProcessed}/${totalItems}) - ${countWords(feedback2)} words`);
                await delay(1000);
            }
            catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
            }
            // ========== SCENARIO 3: AI Explanation (Correct Answer) ==========
            try {
                console.log('   🔄 Generating: AI Detailed Explanation...');
                const explanation = await (0, openrouterService_1.generateDetailedWalkthrough)({
                    profileCode: profile,
                    questionText: question.text,
                    correctAnswer: correctAnswerText,
                    allOptions: question.options.map((opt, idx) => `${letters[idx]}. ${opt}`)
                });
                dataset.push({
                    profile_code: profile,
                    question_id: question.id,
                    question_text: question.text,
                    question_topic: question.topic,
                    difficulty: question.difficulty,
                    correct_answer: correctAnswerText,
                    user_answer: correctAnswerText, // Correct answer
                    scenario_type: 'ai_explanation',
                    attempt_number: 0,
                    ai_response: explanation,
                    response_word_count: countWords(explanation),
                    timestamp: new Date().toISOString()
                });
                totalProcessed++;
                console.log(`   ✅ Done (${totalProcessed}/${totalItems}) - ${countWords(explanation)} words`);
                await delay(1000);
            }
            catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
            }
            // Save progress every 10 items
            if (totalProcessed % 10 === 0) {
                saveDataset(dataset, 'partial');
                console.log(`\n💾 Progress saved: ${totalProcessed}/${totalItems} (${((totalProcessed / totalItems) * 100).toFixed(1)}%)`);
            }
        }
    }
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60; // minutes
    console.log('\n' + '═'.repeat(60));
    console.log('✅ DATASET GENERATION COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`📊 Total entries: ${dataset.length}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} minutes`);
    console.log(`📈 Average: ${(dataset.length / duration).toFixed(1)} entries/min`);
    // Save final dataset
    saveDataset(dataset, 'final');
    // Generate summary statistics
    generateSummary(dataset);
}
function saveDataset(dataset, suffix) {
    const outputDir = path.join(__dirname, '../../output');
    // Create output directory if not exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    // Save as JSON
    const jsonPath = path.join(outputDir, `dataset_${suffix}_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
    console.log(`💾 JSON saved: ${jsonPath}`);
    // Save as CSV
    const csvPath = path.join(outputDir, `dataset_${suffix}_${timestamp}.csv`);
    const csv = convertToCSV(dataset);
    fs.writeFileSync(csvPath, csv);
    console.log(`💾 CSV saved: ${csvPath}`);
}
function convertToCSV(dataset) {
    const headers = [
        'profile_code',
        'question_id',
        'question_topic',
        'difficulty',
        'scenario_type',
        'attempt_number',
        'response_word_count',
        'ai_response',
        'timestamp'
    ];
    const rows = dataset.map(entry => [
        entry.profile_code,
        entry.question_id,
        entry.question_topic,
        entry.difficulty,
        entry.scenario_type,
        entry.attempt_number,
        entry.response_word_count,
        `"${entry.ai_response.replace(/"/g, '""')}"`, // Escape quotes
        entry.timestamp
    ]);
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}
function generateSummary(dataset) {
    console.log('\n📊 DATASET SUMMARY:');
    console.log('═'.repeat(60));
    // Group by profile
    const byProfile = dataset.reduce((acc, entry) => {
        acc[entry.profile_code] = (acc[entry.profile_code] || 0) + 1;
        return acc;
    }, {});
    console.log(`\n🎯 Entries per profile: ${Object.values(byProfile)[0] || 0} (should be ${11 * 3})`);
    // Group by scenario
    const byScenario = dataset.reduce((acc, entry) => {
        acc[entry.scenario_type] = (acc[entry.scenario_type] || 0) + 1;
        return acc;
    }, {});
    console.log('\n📝 Entries by scenario:');
    Object.entries(byScenario).forEach(([scenario, count]) => {
        console.log(`   ${scenario}: ${count}`);
    });
    // Word count statistics
    const wordCounts = dataset.map(e => e.response_word_count);
    const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    const minWords = Math.min(...wordCounts);
    const maxWords = Math.max(...wordCounts);
    console.log('\n📏 Word count statistics:');
    console.log(`   Average: ${avgWords.toFixed(1)} words`);
    console.log(`   Min: ${minWords} words`);
    console.log(`   Max: ${maxWords} words`);
    // Save summary
    const summaryPath = path.join(__dirname, '../../output/summary.txt');
    const summaryText = `
Dataset Generation Summary
Generated: ${new Date().toISOString()}

Total Entries: ${dataset.length}
Profiles: ${Object.keys(byProfile).length}
Questions: ${dataset.filter(e => e.scenario_type === 'ai_explanation').length}
Scenarios per question: 3 (corrective_1, corrective_2, explanation)

Word Count Stats:
- Average: ${avgWords.toFixed(1)}
- Min: ${minWords}
- Max: ${maxWords}

By Scenario:
${Object.entries(byScenario).map(([s, c]) => `- ${s}: ${c}`).join('\n')}
  `.trim();
    fs.writeFileSync(summaryPath, summaryText);
    console.log(`\n💾 Summary saved: ${summaryPath}`);
}
// Run the script
generateDataset()
    .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});
