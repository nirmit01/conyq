// lib/supabase.ts
// Supabase client for server-side operations

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Server-side client with service role (for API routes)
export function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase credentials not configured. Using SQLite fallback.');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Client-side client with anon key (for browser)
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured.');
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey && supabaseAnonKey);
}