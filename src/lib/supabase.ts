import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing so the app doesn't crash immediately,
// allowing us to show a setup screen.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

export type Journey = {
  id: string;
  customer_id: string;
  user_id: string;
  visit_date: string;
  notes: string;
  next_step: string | null;
  created_at: string;
};
