import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  // This logic checks if the code is running in the Vercel production environment.
  const supabaseUrl = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? '/api/supabase' // In production, use the Vercel rewrite path.
    : process.env.NEXT_PUBLIC_SUPABASE_URL!; // For local dev, use the direct URL.

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}