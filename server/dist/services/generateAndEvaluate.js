"use strict";
// server/src/scripts/generateAndEvaluate.ts
// AI Explained - Generate + Evaluate Dataset
// Generates adaptive explanations dan evaluate dengan LLM-as-Judge (6-Dimension)
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
const openrouterService = require('../services/openrouterService');
const evaluationService = require('../services/evaluationService');
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const ALL_PROFILES = [
    '1TGI', '1TGR', '1TAI', '1TAR', '1PGI', '1PGR', '1PAI', '1PAR',
    '2TGI', '2TGR', '2TAI', '2TAR', '2PGI', '2PGR', '2PAI', '2PAR',
    '3TGI', '3TGR', '3TAI', '3TAR', '3PGI', '3PGR', '3PAI', '3PAR',
    '4TGI', '4TGR', '4TAI', '4TAR', '4PGI', '4PGR', '4PAI', '4PAR',
    '5TGI', '5TGR', '5TAI', '5TAR', '5PGI', '5PGR', '5PAI', '5PAR',
    '6TGI', '6TGR', '6TAI', '6TAR', '6PGI', '6PGR', '6PAI', '6PAR'
];
function countWords(text) {
    return text.trim().split(/\s+/).length;
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function getPedagogicLevel(profileCode) {
    return parseInt(profileCode[0]);
}
function formatOptions(options) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    return options.map((opt, idx) => `${letters[idx]}.\n${opt}`).join('\n\n');
}
function getTrueAnswerLetter(correctIndex) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    return letters[correctIndex];
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
async function generateAndEvaluate() {
    try {
        console.log('🚀 Starting Dataset Generation + Evaluation...\n');
        console.log('📝 Step 1: Generate AI Explanations');
        console.log('📊 Step 2: Evaluate each explanation with LLM-as-Judge\n');
        const questions = await fetchQuestions();
        const dataset = [];
        let totalProcessed = 0;
        const totalItems = ALL_PROFILES.length * questions.length;
        console.log(`🎯 Target: ${ALL_PROFILES.length} profiles × ${questions.length} questions = ${totalItems} entries\n`);
        const startTime = Date.now();
        for (const profile of ALL_PROFILES) {
            console.log(`\n🎯 Processing Profile: ${profile} (Level ${getPedagogicLevel(profile)})`);
            console.log('═'.repeat(60));
            for (const question of questions) {
                const letters = ['A', 'B', 'C', 'D', 'E'];
                const correctAnswerText = `${letters[question.correct_answer]}. ${question.options[question.correct_answer]}`;
                console.log(`\n📝 Question: ${question.cognitive_tag || question.text.substring(0, 40)}...`);
                try {
                    // STEP 1: Generate AI Explanation
                    console.log('   🔄 Generating AI Explanation...');
                    const explanation = await openrouterService.generateDetailedWalkthrough({
                        profileCode: profile,
                        questionText: question.text,
                        correctAnswer: correctAnswerText,
                        allOptions: question.options.map((opt, idx) => `${letters[idx]}. ${opt}`)
                    });
                    const wordCount = countWords(explanation);
                    console.log(`   ✅ Generated (${wordCount} words)`);
                    await delay(1000); // Short delay
                    // STEP 2: Evaluate with LLM-as-Judge
                    const evaluation = await evaluationService.evaluateFeedback({
                        profile: profile,
                        question: question.text,
                        options: question.options,
                        correctAnswer: correctAnswerText,
                        studentAnswer: correctAnswerText, // Assuming correct for AI explanation
                        aiFeedback: explanation
                    });
                    console.log(`   ✅ Evaluated (Avg: ${evaluation.overall_average.toFixed(2)}/5)`);
                    const entry = {
                        user_cognitive: profile,
                        user_pedagogic_level: getPedagogicLevel(profile),
                        question: question.text,
                        option: formatOptions(question.options),
                        true_answer: getTrueAnswerLetter(question.correct_answer),
                        ai_explained: explanation,
                        // 6 Main Dimensions
                        eval_instructional_quality: evaluation.instructional_quality,
                        eval_specificity: evaluation.specificity,
                        eval_clarity: evaluation.clarity,
                        eval_motivational_tone: evaluation.motivational_tone,
                        eval_level_suitability: evaluation.level_suitability,
                        // 3 Cognitive Sub-dimensions
                        eval_modality_alignment: evaluation.modality_alignment,
                        eval_structure_alignment: evaluation.structure_alignment,
                        eval_tempo_alignment: evaluation.tempo_alignment,
                        // Aggregates
                        eval_overall_cognitive_alignment: evaluation.overall_cognitive_alignment,
                        eval_overall_average: evaluation.overall_average,
                        eval_strongest_dimension: evaluation.strongest_dimension,
                        eval_weakest_dimension: evaluation.weakest_dimension,
                        eval_learning_impact: evaluation.learning_impact
                    };
                    dataset.push(entry);
                    totalProcessed++;
                    console.log(`   ✅ Complete (${totalProcessed}/${totalItems})`);
                    await delay(2000); // Delay between entries
                }
                catch (error) {
                    console.error(`   ❌ Error: ${error.message}`);
                }
                if (totalProcessed % 10 === 0) {
                    console.log(`\n📊 Progress: ${totalProcessed}/${totalItems} (${((totalProcessed / totalItems) * 100).toFixed(1)}%)`);
                    saveDataset(dataset, 'partial');
                }
            }
        }
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000 / 60;
        console.log('\n' + '═'.repeat(60));
        console.log('✅ GENERATION + EVALUATION COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`📊 Total entries: ${dataset.length}`);
        console.log(`⏱️  Duration: ${duration.toFixed(2)} minutes`);
        console.log('\n💾 Saving complete dataset...');
        saveDataset(dataset, 'final');
        generateSummary(dataset);
    }
    catch (error) {
        console.error('❌ Fatal error:', error);
        throw error;
    }
}
function saveDataset(dataset, suffix) {
    const outputDir = path.join(__dirname, '../../../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const jsonPath = path.join(outputDir, `dataset_evaluated_${suffix}_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
    console.log(`💾 JSON saved: ${jsonPath}`);
    const csvPath = path.join(outputDir, `dataset_evaluated_${suffix}_${timestamp}.csv`);
    const csv = convertToCSV(dataset);
    fs.writeFileSync(csvPath, csv);
    console.log(`💾 CSV saved: ${csvPath}`);
}
function convertToCSV(dataset) {
    const headers = [
        'user_cognitive',
        'user_pedagogic_level',
        'question',
        'option',
        'true_answer',
        'ai_explained',
        'eval_instructional_quality',
        'eval_specificity',
        'eval_clarity',
        'eval_motivational_tone',
        'eval_level_suitability',
        'eval_modality_alignment',
        'eval_structure_alignment',
        'eval_tempo_alignment',
        'eval_overall_cognitive_alignment',
        'eval_overall_average',
        'eval_strongest_dimension',
        'eval_weakest_dimension',
        'eval_learning_impact'
    ];
    const rows = dataset.map(entry => [
        entry.user_cognitive,
        entry.user_pedagogic_level.toString(),
        `"${entry.question.replace(/"/g, '""')}"`,
        `"${entry.option.replace(/"/g, '""')}"`,
        entry.true_answer,
        `"${entry.ai_explained.replace(/"/g, '""')}"`,
        entry.eval_instructional_quality,
        entry.eval_specificity,
        entry.eval_clarity,
        entry.eval_motivational_tone,
        entry.eval_level_suitability,
        entry.eval_modality_alignment,
        entry.eval_structure_alignment,
        entry.eval_tempo_alignment,
        entry.eval_overall_cognitive_alignment.toFixed(2),
        entry.eval_overall_average.toFixed(2),
        `"${entry.eval_strongest_dimension}"`,
        `"${entry.eval_weakest_dimension}"`,
        `"${entry.eval_learning_impact.replace(/"/g, '""')}"`
    ]);
    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}
function generateSummary(dataset) {
    console.log('\n📊 EVALUATION SUMMARY:');
    console.log('═'.repeat(60));
    const avgScores = {
        instructional: dataset.reduce((sum, e) => sum + e.eval_instructional_quality, 0) / dataset.length,
        specificity: dataset.reduce((sum, e) => sum + e.eval_specificity, 0) / dataset.length,
        clarity: dataset.reduce((sum, e) => sum + e.eval_clarity, 0) / dataset.length,
        motivational: dataset.reduce((sum, e) => sum + e.eval_motivational_tone, 0) / dataset.length,
        level_suit: dataset.reduce((sum, e) => sum + e.eval_level_suitability, 0) / dataset.length,
        modality: dataset.reduce((sum, e) => sum + e.eval_modality_alignment, 0) / dataset.length,
        structure: dataset.reduce((sum, e) => sum + e.eval_structure_alignment, 0) / dataset.length,
        tempo: dataset.reduce((sum, e) => sum + e.eval_tempo_alignment, 0) / dataset.length,
        overall: dataset.reduce((sum, e) => sum + e.eval_overall_average, 0) / dataset.length
    };
    console.log('\n📈 Average Evaluation Scores (6-Dimension Rubric):');
    console.log(`   Instructional Quality: ${avgScores.instructional.toFixed(2)}/5`);
    console.log(`   Specificity: ${avgScores.specificity.toFixed(2)}/5`);
    console.log(`   Clarity: ${avgScores.clarity.toFixed(2)}/5`);
    console.log(`   Motivational Tone: ${avgScores.motivational.toFixed(2)}/5`);
    console.log(`   Level Suitability: ${avgScores.level_suit.toFixed(2)}/5`);
    console.log(`   Modality Alignment: ${avgScores.modality.toFixed(2)}/5`);
    console.log(`   Structure Alignment: ${avgScores.structure.toFixed(2)}/5`);
    console.log(`   Tempo Alignment: ${avgScores.tempo.toFixed(2)}/5`);
    console.log(`   Overall Average: ${avgScores.overall.toFixed(2)}/5`);
    const summaryPath = path.join(__dirname, '../../../output/evaluation_summary.txt');
    const summaryText = `
Evaluation Summary
Generated: ${new Date().toISOString()}

Total Entries: ${dataset.length}

Average Scores (6-Dimension Rubric):
- Instructional Quality: ${avgScores.instructional.toFixed(2)}/5
- Specificity: ${avgScores.specificity.toFixed(2)}/5
- Clarity: ${avgScores.clarity.toFixed(2)}/5
- Motivational Tone: ${avgScores.motivational.toFixed(2)}/5
- Level Suitability: ${avgScores.level_suit.toFixed(2)}/5
- Modality Alignment: ${avgScores.modality.toFixed(2)}/5
- Structure Alignment: ${avgScores.structure.toFixed(2)}/5
- Tempo Alignment: ${avgScores.tempo.toFixed(2)}/5
- Overall Average: ${avgScores.overall.toFixed(2)}/5
  `.trim();
    fs.writeFileSync(summaryPath, summaryText);
    console.log(`\n💾 Summary saved: ${summaryPath}`);
}
generateAndEvaluate()
    .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});
