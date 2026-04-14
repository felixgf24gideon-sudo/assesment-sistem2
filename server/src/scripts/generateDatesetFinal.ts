// server/src/scripts/generateDatasetFinal.ts
// Generate dataset dengan AI Explained - BATCH MODE (SINGLE OUTPUT)

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { generateExplanation } from '../services/openrouterExplainService';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const ALL_PROFILES = [
  '1TGI', '1TGR', '1TAI', '1TAR', '1PGI', '1PGR', '1PAI', '1PAR',
  '2TGI', '2TGR', '2TAI', '2TAR', '2PGI', '2PGR', '2PAI', '2PAR',
  '3TGI', '3TGR', '3TAI', '3TAR', '3PGI', '3PGR', '3PAI', '3PAR',
  '4TGI', '4TGR', '4TAI', '4TAR', '4PGI', '4PGR', '4PAI', '4PAR',
  '5TGI', '5TGR', '5TAI', '5TAR', '5PGI', '5PGR', '5PAI', '5PAR',
  '6TGI', '6TGR', '6TAI', '6TAR', '6PGI', '6PGR', '6PAI', '6PAR'
];

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
  topic: string;
  cognitive_tag: string;
}

interface DatasetEntry {
  user_cognitive: string;
  user_pedagogic_level: number;
  question: string;
  option: string;
  true_answer: string;
  ai_explained: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPedagogicLevel(profileCode: string): number {
  return parseInt(profileCode[0]);
}

function formatOptions(options: string[]): string {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return options.map((opt, idx) => `${letters[idx]}.\n${opt}`).join('\n\n');
}

function getTrueAnswerLetter(correctIndex: number): string {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return letters[correctIndex];
}

async function fetchQuestions(): Promise<Question[]> {
  console.log('📥 Fetching questions from database...');
  
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (error) throw error;
  console.log(`✅ Found ${data.length} questions\n`);
  return data as Question[];
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

  const dataset: DatasetEntry[] = [];
  const startTime = Date.now();
  let entryIdx = 0;

  outerLoop: for (const profile of ALL_PROFILES) {
    for (const question of questions) {
      // Check if we're in the current batch range
      if (entryIdx >= endIdx) break outerLoop;
      if (entryIdx < startIdx) {
        entryIdx++;
        continue;
      }

      const letters = ['A', 'B', 'C', 'D', 'E'];
      const correctAnswerText = `${letters[question.correct_answer]}. ${question.options[question.correct_answer]}`;

      console.log(`[${entryIdx + 1}/${totalEntries}] ${profile} - ${question.cognitive_tag}`);

      try {
        // Generate explanation (SINGLE OUTPUT)
        const explanation = await generateExplanation({
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
          ai_explained: explanation  // ← SINGLE OUTPUT
        });

        console.log(`    ✅ ${wordCount}w`);
        await delay(2000);

      } catch (error: any) {
        console.log(`    ❌ ${error.message}`);
      }

      entryIdx++;
    }
  }

  const duration = (Date.now() - startTime) / 1000 / 60;

  console.log(`\n✅ Generated ${dataset.length} entries in ${duration.toFixed(1)}m\n`);

  // Save
  const outputDir = path.join(__dirname, '../../../output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

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
  } else {
    console.log(`\n✅ All batches completed!`);
  }
}

generateDataset().catch(e => {
  console.error('\n❌', e.message);
  process.exit(1);
});