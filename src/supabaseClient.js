import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://brtxljbxesbuxpstnejp.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydHhsamJ4ZXNidXhwc3RuZWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MzA4OTQsImV4cCI6MjA2OTQwNjg5NH0.H4I1Rc9lB5lqSSkR4joD0tZw2rEbnesVOuUw9bL3tpA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
