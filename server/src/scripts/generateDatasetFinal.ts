// server/src/scripts/generateDatasetFinal.ts

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Import OpenRouter service
const openrouterService = require('../services/openrouterService');

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

function delay(ms: number): Promise<void> {
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

  if (error) {
    console.error('❌ Error fetching questions:', error);
    throw error;
  }

  console.log(`✅ Found ${data.length} questions`);
  return data as Question[];
}

async function generateDataset(): Promise<void> {
  try {
    console.log('🚀 Starting Dataset Generation...\n');
    console.log('📊 Headers: user_cognitive | user_pedagogic_level | question | option | true_answer | ai_explained\n');
    console.log('📝 AI Explanations ONLY (No Corrective Feedback)\n');

    const questions = await fetchQuestions();
    const dataset: DatasetEntry[] = [];
    
    let totalProcessed = 0;
    const totalItems = ALL_PROFILES.length * questions.length;

    console.log(`🎯 Target: ${ALL_PROFILES.length} profiles × ${questions.length} questions = ${totalItems} entries\n`);
    console.log('⚠️  Generating in 1 BATCH (saving at the end)\n');

    const startTime = Date.now();

    for (const profile of ALL_PROFILES) {
      console.log(`\n🎯 Processing Profile: ${profile} (Level ${getPedagogicLevel(profile)})`);
      console.log('═'.repeat(60));

      for (const question of questions) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        const correctAnswerText = `${letters[question.correct_answer]}. ${question.options[question.correct_answer]}`;

        console.log(`\n📝 Question: ${question.cognitive_tag || question.text.substring(0, 40)}...`);

        try {
          console.log('   🔄 Generating AI Explanation...');
          
          const explanation = await openrouterService.generateDetailedWalkthrough({
            profileCode: profile,
            questionText: question.text,
            correctAnswer: correctAnswerText,
            allOptions: question.options.map((opt: string, idx: number) => `${letters[idx]}. ${opt}`)
          });

          const entry: DatasetEntry = {
            user_cognitive: profile,
            user_pedagogic_level: getPedagogicLevel(profile),
            question: question.text,
            option: formatOptions(question.options),
            true_answer: getTrueAnswerLetter(question.correct_answer),
            ai_explained: explanation
          };

          dataset.push(entry);

          totalProcessed++;
          const wordCount = countWords(explanation);
          console.log(`   ✅ Done (${totalProcessed}/${totalItems}) - ${wordCount} words`);
          
          await delay(2000);

        } catch (error: any) {
          console.error(`   ❌ Error: ${error.message}`);
        }

        if (totalProcessed % 50 === 0) {
          console.log(`\n📊 Progress: ${totalProcessed}/${totalItems} (${((totalProcessed/totalItems)*100).toFixed(1)}%)`);
        }
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000 / 60;

    console.log('\n' + '═'.repeat(60));
    console.log('✅ DATASET GENERATION COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`📊 Total entries: ${dataset.length}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} minutes`);
    console.log(`📈 Average: ${(dataset.length / duration).toFixed(1)} entries/min`);
    
    console.log('\n💾 Saving complete dataset...');
    saveDataset(dataset);
    generateSummary(dataset);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

function saveDataset(dataset: DatasetEntry[]): void {
  const outputDir = path.join(__dirname, '../../../output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  
  const jsonPath = path.join(outputDir, `dataset_final_${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(dataset, null, 2));
  console.log(`✅ JSON saved: ${jsonPath}`);

  const csvPath = path.join(outputDir, `dataset_final_${timestamp}.csv`);
  const csv = convertToCSV(dataset);
  fs.writeFileSync(csvPath, csv);
  console.log(`✅ CSV saved: ${csvPath}`);
}

function convertToCSV(dataset: DatasetEntry[]): string {
  const headers = [
    'user_cognitive',
    'user_pedagogic_level',
    'question',
    'option',
    'true_answer',
    'ai_explained'
  ];

  const rows = dataset.map(entry => [
    entry.user_cognitive,
    entry.user_pedagogic_level.toString(),
    `"${entry.question.replace(/"/g, '""')}"`,
    `"${entry.option.replace(/"/g, '""')}"`,
    entry.true_answer,
    `"${entry.ai_explained.replace(/"/g, '""')}"`,
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

function generateSummary(dataset: DatasetEntry[]): void {
  console.log('\n📊 DATASET SUMMARY:');
  console.log('═'.repeat(60));

  const byProfile: Record<string, number> = {};
  dataset.forEach(entry => {
    byProfile[entry.user_cognitive] = (byProfile[entry.user_cognitive] || 0) + 1;
  });

  console.log(`\n🎯 Total profiles: ${Object.keys(byProfile).length}`);
  console.log(`🎯 Entries per profile: ${Object.values(byProfile)[0] || 0}`);

  const wordCounts = dataset.map(e => countWords(e.ai_explained));
  const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const minWords = Math.min(...wordCounts);
  const maxWords = Math.max(...wordCounts);

  console.log('\n📏 Word count statistics:');
  console.log(`   Average: ${avgWords.toFixed(1)} words`);
  console.log(`   Min: ${minWords} words`);
  console.log(`   Max: ${maxWords} words`);

  const summaryPath = path.join(__dirname, '../../../output/summary.txt');
  const summaryText = `
Dataset Generation Summary
Generated: ${new Date().toISOString()}

Headers: user_cognitive, user_pedagogic_level, question, option, true_answer, ai_explained

Total Entries: ${dataset.length}
Profiles: ${Object.keys(byProfile).length}
Questions per profile: ${Object.values(byProfile)[0] || 0}

Word Count Stats:
- Average: ${avgWords.toFixed(1)}
- Min: ${minWords}
- Max: ${maxWords}
  `.trim();

  fs.writeFileSync(summaryPath, summaryText);
  console.log(`\n💾 Summary saved: ${summaryPath}`);
}

// Run
generateDataset()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });