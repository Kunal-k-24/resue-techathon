import { createClient } from '@supabase/supabase-js';

// Hardcoded for hackathon readiness as .env is gitignored
const supabaseUrl = 'https://gephosibdkqugbknstfj.supabase.co';
const supabaseAnonKey = 'sb_publishable_wghfZMBHGVpTUAJskXWTLw_6bTax4Wf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
