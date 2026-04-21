"use strict";
// server/src/scripts/generateDatasetFinal.ts
// Generate dataset dengan AI Explained - BATCH MODE (SINGLE OUTPUT)
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
const openrouterExplainService_1 = require("../services/openrouterExplainService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
    if (error)
        throw error;
    console.log(`✅ Found ${data.length} questions\n`);
    return data;
}
async function generateDataset() {
    const args = process.argv.slice(2);
    const BATCH_SIZE = 50;
    let batchNum = 1;
    const batchIdx = args.indexOf('--batch');
    if (batchIdx !== -1 && args[batchIdx + 1]) {
        batchNum = parseInt(args[batchIdx + 1]);
    }
    const startIdx = (batchNum - 1) * BATCH_SIZE;
    const endIdx = startIdx + BATCH_SIZE;
    console.log('🚀 AI Explained Dataset Generation (BATCH MODE)\n');
    const questions = await fetchQuestions();
    const totalEntries = ALL_PROFILES.length * questions.length;
    const totalBatches = Math.ceil(totalEntries / BATCH_SIZE);
    console.log(`📊 Batch ${batchNum}/${totalBatches}`);
    console.log(`📊 Entry range: ${startIdx + 1} to ${Math.min(endIdx, totalEntries)}\n`);
    const dataset = [];
    const startTime = Date.now();
    let entryIdx = 0;
    outerLoop: for (const profile of ALL_PROFILES) {
        for (const question of questions) {
            // Check if we're in the current batch range
            if (entryIdx >= endIdx)
                break outerLoop;
            if (entryIdx < startIdx) {
                entryIdx++;
                continue;
            }
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const correctAnswerText = `${letters[question.correct_answer]}. ${question.options[question.correct_answer]}`;
            console.log(`[${entryIdx + 1}/${totalEntries}] ${profile} - ${question.cognitive_tag}`);
            try {
                // Generate explanation (SINGLE OUTPUT)
                const explanation = await (0, openrouterExplainService_1.generateExplanation)({
                    profileCode: profile,
                    questionText: question.text,
                    correctAnswer: correctAnswerText,
                    attemptNumber: 1
                });
                const wordCount = countWords(explanation);
                dataset.push({
                    user_cognitive: profile,
                    user_pedagogic_level: getPedagogicLevel(profile),
                    question: question.text,
                    option: formatOptions(question.options),
                    true_answer: getTrueAnswerLetter(question.correct_answer),
                    ai_explained: explanation // ← SINGLE OUTPUT
                });
                console.log(`    ✅ ${wordCount}w`);
                await delay(2000);
            }
            catch (error) {
                console.log(`    ❌ ${error.message}`);
            }
            entryIdx++;
        }
    }
    const duration = (Date.now() - startTime) / 1000 / 60;
    console.log(`\n✅ Generated ${dataset.length} entries in ${duration.toFixed(1)}m\n`);
    // Save
    const outputDir = path.join(__dirname, '../../../output');
    if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir, { recursive: true });
    const ts = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const csvPath = path.join(outputDir, `dataset_batch_${batchNum}_${ts}.csv`);
    const jsonPath = path.join(outputDir, `dataset_batch_${batchNum}_${ts}.json`);
    // CSV headers
    const headers = ['user_cognitive', 'user_pedagogic_level', 'question', 'option', 'true_answer', 'ai_explained'];
    const rows = dataset.map(e => [
        e.user_cognitive,
        e.user_pedagogic_level,
        `"${e.question.replace(/"/g, '""')}"`,
        `"${e.option.replace(/"/g, '""')}"`,
        e.true_answer,
        `"${e.ai_explained.replace(/"/g, '""')}"`,
    ]);
    fs.writeFileSync(csvPath, [headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
    console.log(`💾 CSV: ${path.basename(csvPath)}`);
    console.log(`💾 JSON: ${path.basename(jsonPath)}`);
    if (endIdx < totalEntries) {
        console.log(`\n📌 Next: npm run generate-dataset -- --batch ${batchNum + 1}`);
    }
    else {
        console.log(`\n✅ All batches completed!`);
    }
}
generateDataset().catch(e => {
    console.error('\n❌', e.message);
    process.exit(1);
});
