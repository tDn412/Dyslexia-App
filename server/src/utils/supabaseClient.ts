import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || (!supabaseKey && !supabaseAnonKey)) {
  throw new Error('Missing Supabase URL or Keys');
}

// Fallback to Anon Key if Service Key is missing (for development)
const keyToUse = supabaseKey || supabaseAnonKey;

if (!supabaseKey) {
  console.warn("⚠️ WARNING: SUPABASE_SERVICE_KEY is missing. Using SUPABASE_ANON_KEY as fallback. Some RLS policies might block writes.");
}

export const supabase = createClient(supabaseUrl, keyToUse!, {
  auth: {
    persistSession: false, // Vì đây là server backend, không cần duy trì session
  }
});

// Bạn có thể export thêm client dùng Anon Key nếu cần
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey!);