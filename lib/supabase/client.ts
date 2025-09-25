import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const isBrowser = typeof window !== 'undefined';

  const supabaseUrl = 
    isBrowser && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
      ? `${window.location.origin}/api/supabase`
      : process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // This is the crucial part that was missing
      cookieOptions: {
        // The leading dot is important for it to work on subdomains (www)
        domain: '.theiaseek.com', 
        path: '/',
        sameSite: 'lax',
        secure: true
      },
    }
  );
}