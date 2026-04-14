// client/src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection (optional - for debugging)
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('questions').select('count');
    if (error) throw error;
    console.log('✅ Client: Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Client: Supabase connection failed:', error);
    return false;
  }
}