/** Public Supabase web config. RLS is the real lock; never put the service_role key here. */
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://hrgwnaamlwaneccwghie.supabase.co';

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZ3duYWFtbHdhbmVjY3dnaGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NTM0OTQsImV4cCI6MjEwNTUyOTQ5NH0.UKHTNZcPBSo-V1xQlDoViTPBASfXgbpdCGgSvE2mDQA';
