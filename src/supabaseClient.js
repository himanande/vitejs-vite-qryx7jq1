import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrchqkvypkvmxfavhyzj.supabase.co';
const supabaseAnonKey = 'sb_publishable_c7tT0b8bMAzBQNhJW5Ldng_tQNU1VOv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
