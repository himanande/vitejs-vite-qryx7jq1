import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wcsurvnglqazxlckgxxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjc3Vydm5nbHFhenhsY2tneHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Nzg4NDIsImV4cCI6MjA5ODE1NDg0Mn0.SeARF5CjCBCqARbS2kR2MavLQdQ5Dg4dSU1yBYkw57E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data: themes, error } = await supabase
  .from('themes')
  .select('id, name, category_id, description')
  .order('id');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Themes:');
  themes.forEach(t => {
    console.log(`ID ${t.id}: [category_id=${t.category_id}] ${t.name}`);
    if (t.description) console.log(`  Description: ${t.description}`);
  });
}

const { data: categories, error: catError } = await supabase
  .from('categories')
  .select('id, name')
  .order('id');

if (!catError) {
  console.log('\nCategories:');
  categories.forEach(c => console.log(`ID ${c.id}: ${c.name}`));
}
