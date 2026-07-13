import { createClient } from '@supabase/supabase-js';

// Ganti URL dan KEY di bawah dengan data dari dashboard Supabase Anda
// (Settings -> API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);