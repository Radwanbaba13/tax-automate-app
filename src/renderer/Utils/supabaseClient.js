import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbgokmlujsxywqioanhm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZ29rbWx1anN4eXdxaW9hbmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2NjI3MDIsImV4cCI6MjA0NDIzODcwMn0.f0-MTTRKm5VcK_ggd_0m9MKvdG1sLfQHa9lEiRPQzVI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
