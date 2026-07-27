import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wcsurvnglqazxlckgxxg.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjc3Vydm5nbHFhenhsY2tneHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Nzg4NDIsImV4cCI6MjA5ODE1NDg0Mn0.SeARF5CjCBCqARbS2kR2MavLQdQ5Dg4dSU1yBYkw57E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
