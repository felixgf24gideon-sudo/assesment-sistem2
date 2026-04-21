"use strict";
// server/src/services/openrouterClient.ts
// NEUTRAL - Hanya API call, tanpa prompt/personalisasi apa pun
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callOpenRouter = callOpenRouter;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const AI_MODEL = process.env.AI_MODEL || 'deepseek/deepseek-r1';
const APP_NAME = process.env.APP_NAME || 'adaptive-practice';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
console.log('🔧 OpenRouter Client Initialized:');
console.log(`   API Key: ${OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 15) + '...' : '❌ NOT SET'}`);
console.log(`   Model: ${AI_MODEL}`);
console.log(`   Base URL: ${OPENROUTER_BASE_URL}`);
console.log(`   Using: Parametric Profile System ✅\n`);
if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ OPENROUTER_API_KEY is not set. Using fallback feedback.');
}
/**
 * NEUTRAL API CALLER - No prompts, just OpenRouter communication
 * Used by both feedback service and explain service
 */
async function callOpenRouter(messages, options = {}) {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'sk-or-v1-YOUR_KEY_HERE') {
        throw new Error('OpenRouter API key not configured');
    }
    try {
        const response = await axios_1.default.post(`${OPENROUTER_BASE_URL}/chat/completions`, {
            model: AI_MODEL,
            messages,
            max_tokens: options.maxTokens || 200,
            temperature: options.temperature || 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': APP_URL,
                'X-Title': APP_NAME,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
        const content = response.data.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content in OpenRouter response');
        }
        console.log('✅ OpenRouter API call successful');
        console.log(`   Model: ${response.data.model}`);
        console.log(`   Tokens: ${response.data.usage.total_tokens}`);
        return content.trim();
    }
    catch (error) {
        console.error('❌ OpenRouter API error:', error.response?.data || error.message);
        throw new Error(`OpenRouter API failed: ${error.message}`);
    }
}
exports.default = {
    callOpenRouter,
};
