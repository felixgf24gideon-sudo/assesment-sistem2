"use strict";
// server/src/scripts/generateDataset.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabase_js_1 = require("@supabase/supabase-js");
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
        console.error('❌);
    }
}
