import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sipvxeusbdbuyvkrxnws.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcHZ4ZXVzYmRidXl2a3J4bndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODQ0NjgsImV4cCI6MjA3OTY2MDQ2OH0.gZ26RTq4hIC556Oew9n5apYcGif5CVyRzE0B5xfvcD0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
