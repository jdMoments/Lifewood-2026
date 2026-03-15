import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vebyxfmwwydqdmojwlsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYnl4Zm13d3lkcWRtb2p3bHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NzE5NDYsImV4cCI6MjA4ODM0Nzk0Nn0.0OX6pJTykfxzIr1GhnFYj6A3XzhiT-aCOrsUGEG39ac';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
