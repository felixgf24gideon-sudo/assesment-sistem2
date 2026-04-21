"use strict";
// server/src/scripts/generateFeedbackControl.ts
// CONTROL GROUP - Profile-Aware but NO Personalization Instructions
// Evaluated using LLM-as-Judge with 6-Dimension Rubric
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const evaluationService_1 = require("../services/evaluationService");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const TEST_PROFILES = ['1TGI', '3TGI', '5TGR', '6PAR'];
const ALL_PROFILES = [
    '1TGI', '1TGR', '1TAI', '1TAR', '1PGI', '1PGR', '1PAI', '1PAR',
    '2TGI', '2TGR', '2TAI', '2TAR', '2PGI', '2PGR', '2PAI', '2PAR',
    '3TGI', '3TGR', '3TAI', '3TAR', '3PGI', '3PGR', '3PAI', '3PAR',
    '4TGI', '4TGR', '4TAI', '4TAR', '4PGI', '4PGR', '4PAI', '4PAR',
    '5TGI', '5TGR', '5TAI', '5TAR', '5PGI', '5PGR', '5PAI', '5PAR',
    '6TGI', '6TGR', '6TAI', '6TAR', '6PGI', '6PGR', '6PAI', '6PAR'
];
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function countWords(text) {
    return text.trim().split(/\s+/).length;
}
function getPedagogicLevel(profileCode) {
    return parseInt(profileCode[0]);
}
function getTempo(profileCode) {
    return profileCode[3];
}
function formatOptions(options) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    return options.map((opt, idx) => `${letters[idx]}.\n${opt}`).join('\n\n');
}
function getTrueAnswerLetter(correctIndex) {
    return ['A', 'B', 'C', 'D', 'E'][correctIndex];
}
// CONTROL GROUP PROMPT - Profile as Student ID only (NO explanation)
function buildControlPrompt(params) {
    return `You are an AI tutor providing corrective feedback to students.

Student ID: ${params.profileCode}

Question:
${params.questionText}

Options:
${params.allOptions.join('\n')}

Student's Answer (WRONG): ${params.userAnswer}
Correct Answer: ${params.correctAnswer}

Provide corrective feedback in Indonesian that explains why the answer is incorrect and guides toward the correct solution.`;
}
// GENERATE CONTROL GROUP FEEDBACK (No personalization)
async function generateControlFeedback(params) {
    const prompt = buildControlPrompt(params);
    try {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: process.env.AI_MODEL || 'google/gemma-3-27b-it',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Adaptive Practice Control Group',
                'Content-Type': 'application/json'
            }
        });
        const data = response.data;
        return data?.choices?.[0]?.message?.content?.trim() || '';
    }
    catch (error) {
        console.error('❌ API Error:', error.message);
        throw error;
    }
}
async function fetchQuestions() {
    console.log('📥 Fetching questions...');
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('id');
    if (error)
        throw error;
    console.log(`✅ Found ${data.length} questions`);
    return data;
}
function calculateMetrics(dataset) {
    const wordCounts = dataset.map(e => e.feedback_word_count);
    const byLevel = {};
    for (let level = 1; level <= 6; level++) {
        const levelData = dataset.filter(e => e.user_pedagogic_level === level);
        if (levelData.length > 0) {
            byLevel[level] = {
                avgWords: levelData.reduce((sum, e) => sum + e.feedback_word_count, 0) / levelData.length,
                avgOverallScore: levelData.reduce((sum, e) => sum + e.overall_personalization_score, 0) / levelData.length,
                avgTempoAlignment: levelData.reduce((sum, e) => sum + e.tempo_alignment, 0) / levelData.length,
                count: levelData.length
            };
        }
    }
    const impulsiveData = dataset.filter(e => getTempo(e.user_cognitive) === 'I');
    const reflectiveData = dataset.filter(e => getTempo(e.user_cognitive) === 'R');
    return {
        totalEntries: dataset.length,
        avgWordCount: wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length,
        minWordCount: Math.min(...wordCounts),
        maxWordCount: Math.max(...wordCounts),
        // 6 Main Dimensions
        avgInstructionalQuality: dataset.reduce((sum, e) => sum + e.instructional_quality, 0) / dataset.length,
        avgClarityAndPracticality: dataset.reduce((sum, e) => sum + e.clarity_and_practicality, 0) / dataset.length,
        avgModalityAlignment: dataset.reduce((sum, e) => sum + e.modality_alignment, 0) / dataset.length,
        avgStructureAlignment: dataset.reduce((sum, e) => sum + e.structure_alignment, 0) / dataset.length,
        avgTempoAlignment: dataset.reduce((sum, e) => sum + e.tempo_alignment, 0) / dataset.length,
        avgPersonalizedMotivation: dataset.reduce((sum, e) => sum + e.personalized_motivation, 0) / dataset.length,
        // Overall
        avgOverallPersonalizationScore: dataset.reduce((sum, e) => sum + e.overall_personalization_score, 0) / dataset.length,
        byLevel,
        byTempo: {
            I: {
                avgWords: impulsiveData.length > 0 ? impulsiveData.reduce((sum, e) => sum + e.feedback_word_count, 0) / impulsiveData.length : 0,
                avgScore: impulsiveData.length > 0 ? impulsiveData.reduce((sum, e) => sum + e.overall_personalization_score, 0) / impulsiveData.length : 0,
                avgTempoAlignment: impulsiveData.length > 0 ? impulsiveData.reduce((sum, e) => sum + e.tempo_alignment, 0) / impulsiveData.length : 0,
                count: impulsiveData.length
            },
            R: {
                avgWords: reflectiveData.length > 0 ? reflectiveData.reduce((sum, e) => sum + e.feedback_word_count, 0) / reflectiveData.length : 0,
                avgScore: reflectiveData.length > 0 ? reflectiveData.reduce((sum, e) => sum + e.overall_personalization_score, 0) / reflectiveData.length : 0,
                avgTempoAlignment: reflectiveData.length > 0 ? reflectiveData.reduce((sum, e) => sum + e.tempo_alignment, 0) / reflectiveData.length : 0,
                count: reflectiveData.length
            }
        }
    };
}
function displayMetrics(metrics) {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 CONTROL GROUP - LLM-JUDGED QUALITY ANALYSIS');
    console.log('    (Profile as ID only - No Personalization)');
    console.log('═'.repeat(70));
    console.log(`\n📈 Overall Statistics (n=${metrics.totalEntries}):`);
    console.log(`   Overall Personalization Score: ${metrics.avgOverallPersonalizationScore.toFixed(2)}/5.0`);
    console.log(`   Avg Word Count: ${metrics.avgWordCount.toFixed(1)} words`);
    console.log(`   Range: ${metrics.minWordCount}-${metrics.maxWordCount} words`);
    console.log('\n📊 6-Dimension Breakdown:');
    console.log(`   1. Instructional Quality:     ${metrics.avgInstructionalQuality.toFixed(2)}/5`);
    console.log(`   2. Clarity & Practicality:    ${metrics.avgClarityAndPracticality.toFixed(2)}/5`);
    console.log(`   3. Modality Alignment (T/P):  ${metrics.avgModalityAlignment.toFixed(2)}/5`);
    console.log(`   4. Structure Alignment (G/A): ${metrics.avgStructureAlignment.toFixed(2)}/5`);
    console.log(`   5. Tempo Alignment (I/R):     ${metrics.avgTempoAlignment.toFixed(2)}/5`);
    console.log(`   6. Personalized Motivation:   ${metrics.avgPersonalizedMotivation.toFixed(2)}/5`);
    console.log('\n📊 By Tempo (Impulsive vs Reflective):');
    console.log(`   Impulsive (I) [n=${metrics.byTempo.I.count}]:`);
    console.log(`      Avg Words: ${metrics.byTempo.I.avgWords.toFixed(0)}w`);
    console.log(`      Score: ${metrics.byTempo.I.avgScore.toFixed(2)}/5`);
    console.log(`      Tempo Alignment: ${metrics.byTempo.I.avgTempoAlignment.toFixed(2)}/5`);
    console.log(`   Reflective (R) [n=${metrics.byTempo.R.count}]:`);
    console.log(`      Avg Words: ${metrics.byTempo.R.avgWords.toFixed(0)}w`);
    console.log(`      Score: ${metrics.byTempo.R.avgScore.toFixed(2)}/5`);
    console.log(`      Tempo Alignment: ${metrics.byTempo.R.avgTempoAlignment.toFixed(2)}/5`);
    if (metrics.byTempo.I.count > 0 && metrics.byTempo.R.count > 0) {
        const tempoRatio = metrics.byTempo.R.avgWords / metrics.byTempo.I.avgWords;
        const tempoAlignmentDiff = Math.abs(metrics.byTempo.R.avgTempoAlignment - metrics.byTempo.I.avgTempoAlignment);
        console.log(`\n   📏 Differentiation Metrics:`);
        console.log(`      Word Count Ratio (R/I): ${tempoRatio.toFixed(2)}x`);
        console.log(`      Tempo Alignment Diff: ${tempoAlignmentDiff.toFixed(2)}`);
        if (tempoRatio < 1.2) {
            console.log(`      ✅ LOW differentiation (expected - no personalization)`);
        }
        else if (tempoRatio < 1.5) {
            console.log(`      ⚠️  MODERATE differentiation (some natural variation)`);
        }
        else {
            console.log(`      ⚠️  HIGH differentiation (unexpected for control group)`);
        }
    }
    console.log('\n📊 By Pedagogic Level:');
    for (let level = 1; level <= 6; level++) {
        if (metrics.byLevel[level]) {
            const data = metrics.byLevel[level];
            console.log(`   L${level}: ${data.avgWords.toFixed(0)}w | Score: ${data.avgOverallScore.toFixed(2)}/5 | Tempo: ${data.avgTempoAlignment.toFixed(2)}/5 | n=${data.count}`);
        }
    }
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 CONTROL GROUP ASSESSMENT:\n');
    if (metrics.avgTempoAlignment < 3.0) {
        console.log('   ✅ Low Tempo Alignment (expected - no personalization)');
    }
    else {
        console.log('   ⚠️  Tempo Alignment higher than expected');
    }
    if (metrics.avgPersonalizedMotivation < 3.2) {
        console.log('   ✅ Low Personalized Motivation (expected - generic)');
    }
    else {
        console.log('   ⚠️  Personalized Motivation higher than expected');
    }
    console.log('\n   This establishes baseline for personalization comparison.');
    console.log('═'.repeat(70) + '\n');
}
async function generateControlDataset(useTestMode = true) {
    const profiles = useTestMode ? TEST_PROFILES : ALL_PROFILES;
    console.log('🔬 CONTROL GROUP - Non-Personalized Feedback Generation');
    console.log('═'.repeat(70));
    console.log(`📊 Mode: ${useTestMode ? 'TEST (4 profiles)' : 'FULL (48 profiles)'}`);
    console.log(`🤖 Generation Model: ${process.env.AI_MODEL}`);
    console.log(`⚖️  Evaluation: LLM-as-Judge (6-Dimension Refined Rubric)`);
    console.log('\n📋 Condition:');
    console.log('   ✅ Profile code provided as Student ID');
    console.log('   ❌ NO profile explanation given');
    console.log('   ❌ NO personalization instructions');
    console.log('   ❌ NO tempo-specific guidance');
    console.log('   ❌ NO level-specific adaptation');
    console.log('═'.repeat(70) + '\n');
    const questions = await fetchQuestions();
    const dataset = [];
    let totalProcessed = 0;
    const totalItems = profiles.length * questions.length;
    console.log(`🎯 Target: ${totalItems} entries\n`);
    const startTime = Date.now();
    for (const profile of profiles) {
        console.log(`\n🎯 Profile: ${profile}`);
        for (const question of questions) {
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const wrongAnswerIndex = question.correct_answer === 0 ? 1 : 0;
            const wrongAnswerText = `${letters[wrongAnswerIndex]}. ${question.options[wrongAnswerIndex]}`;
            const correctAnswerText = `${letters[question.correct_answer]}. ${question.options[question.correct_answer]}`;
            console.log(`\n📝 ${question.cognitive_tag}`);
            try {
                // Step 1: Generate generic feedback
                console.log('   🔄 Generating generic feedback...');
                const feedback = await generateControlFeedback({
                    profileCode: profile,
                    questionText: question.text,
                    userAnswer: wrongAnswerText,
                    correctAnswer: correctAnswerText,
                    allOptions: question.options.map((opt, idx) => `${letters[idx]}. ${opt}`)
                });
                const wordCount = countWords(feedback);
                console.log(`   ✅ Generated: ${wordCount} words`);
                // Step 2: Evaluate with LLM-as-Judge (NEW 6-DIMENSION RUBRIC)
                console.log('   📊 Evaluating with LLM Judge (6-Dimension)...');
                const evaluation = await (0, evaluationService_1.evaluateFeedback)({
                    profile: profile,
                    question: question.text,
                    options: question.options,
                    correctAnswer: correctAnswerText,
                    studentAnswer: wrongAnswerText,
                    aiFeedback: feedback,
                    experimentGroup: 'control'
                });
                console.log(`   ✅ Overall Score: ${evaluation.overall_personalization_score.toFixed(1)}/5`);
                console.log(`   🎯 Tempo Alignment: ${evaluation.tempo_alignment.toFixed(1)}/5`);
                dataset.push({
                    user_cognitive: profile,
                    user_pedagogic_level: getPedagogicLevel(profile),
                    question: question.text,
                    option: formatOptions(question.options),
                    user_answer: getTrueAnswerLetter(wrongAnswerIndex),
                    true_answer: getTrueAnswerLetter(question.correct_answer),
                    ai_feedback: feedback,
                    feedback_word_count: wordCount,
                    // 6 Refined Dimensions
                    instructional_quality: evaluation.instructional_quality,
                    clarity_and_practicality: evaluation.clarity_and_practicality,
                    modality_alignment: evaluation.modality_alignment,
                    structure_alignment: evaluation.structure_alignment,
                    tempo_alignment: evaluation.tempo_alignment,
                    personalized_motivation: evaluation.personalized_motivation,
                    // Overall
                    overall_personalization_score: evaluation.overall_personalization_score,
                    // Insights
                    strongest_dimension: evaluation.strongest_dimension,
                    weakest_dimension: evaluation.weakest_dimension,
                    critical_failures: evaluation.critical_failures,
                    learning_impact: evaluation.learning_impact
                });
                totalProcessed++;
                console.log(`   ✅ Progress: ${totalProcessed}/${totalItems}`);
                await delay(4000);
            }
            catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                dataset.push({
                    user_cognitive: profile,
                    user_pedagogic_level: getPedagogicLevel(profile),
                    question: question.text,
                    option: formatOptions(question.options),
                    user_answer: getTrueAnswerLetter(wrongAnswerIndex),
                    true_answer: getTrueAnswerLetter(question.correct_answer),
                    ai_feedback: 'ERROR: ' + error.message,
                    feedback_word_count: 0,
                    instructional_quality: 0,
                    clarity_and_practicality: 0,
                    modality_alignment: 0,
                    structure_alignment: 0,
                    tempo_alignment: 0,
                    personalized_motivation: 0,
                    overall_personalization_score: 0,
                    strongest_dimension: 'ERROR',
                    weakest_dimension: 'ERROR',
                    critical_failures: 'ERROR',
                    learning_impact: 'ERROR'
                });
            }
        }
        // Show metrics after each profile
        if (dataset.length > 0) {
            const validDataset = dataset.filter(e => e.overall_personalization_score > 0);
            if (validDataset.length > 0) {
                const metrics = calculateMetrics(validDataset);
                displayMetrics(metrics);
            }
        }
    }
    const duration = (Date.now() - startTime) / 60000;
    console.log('\n' + '═'.repeat(70));
    console.log('✅ CONTROL GROUP GENERATION COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`📊 Total Entries: ${dataset.length}`);
    console.log(`✅ Successful: ${dataset.filter(e => e.overall_personalization_score > 0).length}`);
    console.log(`❌ Errors: ${dataset.filter(e => e.overall_personalization_score === 0).length}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} minutes`);
    const validDataset = dataset.filter(e => e.overall_personalization_score > 0);
    if (validDataset.length > 0) {
        const finalMetrics = calculateMetrics(validDataset);
        displayMetrics(finalMetrics);
    }
    saveDataset(dataset, useTestMode ? 'test' : 'full');
}
function saveDataset(dataset, suffix) {
    const outputDir = path.join(__dirname, '../../../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const modelName = (process.env.AI_MODEL || 'unknown').replace(/\//g, '_');
    // Save CSV
    const csvPath = path.join(outputDir, `control_non_personalized_${modelName}_${suffix}_${timestamp}.csv`);
    const csv = convertToCSV(dataset);
    fs.writeFileSync(csvPath, csv);
    console.log(`\n💾 CSV saved: ${csvPath}`);
    // Save JSON
    const jsonPath = path.join(outputDir, `control_non_personalized_${modelName}_${suffix}_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
    console.log(`💾 JSON saved: ${jsonPath}`);
    // Save metadata
    const validDataset = dataset.filter(e => e.overall_personalization_score > 0);
    const metadata = {
        experiment_type: 'control_group',
        personalization: false,
        generation_model: process.env.AI_MODEL,
        evaluation_method: 'LLM-as-Judge (6-Dimension Refined Rubric)',
        dimensions: [
            'Instructional Quality',
            'Clarity & Practicality',
            'Modality Alignment',
            'Structure Alignment',
            'Tempo Alignment',
            'Personalized Motivation'
        ],
        timestamp: new Date().toISOString(),
        total_entries: dataset.length,
        successful_entries: validDataset.length,
        failed_entries: dataset.filter(e => e.overall_personalization_score === 0).length,
        metrics: validDataset.length > 0 ? calculateMetrics(validDataset) : null,
        description: 'Profile code provided as ID only - No personalization instructions - Control baseline for research'
    };
    const metadataPath = path.join(outputDir, `control_metadata_${suffix}_${timestamp}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`💾 Metadata saved: ${metadataPath}`);
}
function convertToCSV(dataset) {
    const headers = [
        'user_cognitive', 'user_pedagogic_level', 'question', 'option',
        'user_answer', 'true_answer', 'ai_feedback', 'feedback_word_count',
        'instructional_quality', 'clarity_and_practicality',
        'modality_alignment', 'structure_alignment', 'tempo_alignment',
        'personalized_motivation', 'overall_personalization_score',
        'strongest_dimension', 'weakest_dimension', 'critical_failures', 'learning_impact'
    ];
    const rows = dataset.map(e => [
        e.user_cognitive,
        e.user_pedagogic_level,
        `"${e.question.replace(/"/g, '""')}"`,
        `"${e.option.replace(/"/g, '""')}"`,
        e.user_answer,
        e.true_answer,
        `"${e.ai_feedback.replace(/"/g, '""')}"`,
        e.feedback_word_count,
        e.instructional_quality.toFixed(2),
        e.clarity_and_practicality.toFixed(2),
        e.modality_alignment.toFixed(2),
        e.structure_alignment.toFixed(2),
        e.tempo_alignment.toFixed(2),
        e.personalized_motivation.toFixed(2),
        e.overall_personalization_score.toFixed(2),
        e.strongest_dimension,
        e.weakest_dimension,
        `"${e.critical_failures.replace(/"/g, '""')}"`,
        `"${e.learning_impact.replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
const useTestMode = !process.argv.includes('--full');
generateControlDataset(useTestMode)
    .then(() => {
    console.log('\n✅ Control group generation completed successfully!');
    console.log('\n📊 Next Steps:');
    console.log('   1. Review the metrics above');
    console.log('   2. Run personalized version: npm run generate-feedback');
    console.log('   3. Compare results between control and treatment');
    if (useTestMode) {
        console.log('\n💡 To run full dataset: npm run generate-control -- --full');
    }
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
