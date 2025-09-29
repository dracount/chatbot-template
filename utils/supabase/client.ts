import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  // Check if the code is running in a browser environment
  const isBrowser = typeof window !== 'undefined';

  // Determine the correct Supabase URL
  // In production on the browser, we construct the full URL for the rewrite.
  // Otherwise (on the server or in local dev), we use the direct environment variable.
  const supabaseUrl = 
    isBrowser && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
      ? `${window.location.origin}/api/supabase`
      : process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const cookieDomain = process.env.COOKIE_DOMAIN || (isBrowser ? window.location.hostname : undefined);
  const secureFlag = isBrowser ? (process.env.NODE_ENV === 'production' || window.location.protocol === 'https:') : false;

  const cookieOptions = {
    name: 'sb-',
    domain: cookieDomain,
    path: '/',
    sameSite: 'lax' as const,
    secure: secureFlag
  };

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions }
  );
}