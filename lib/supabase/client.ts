import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const isBrowser = typeof window !== 'undefined';
  const isLocal = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  const supabaseUrl =
    isBrowser && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && !isLocal
      ? `${window.location.origin}/api/supabase`
      : process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const options = {
    auth: {
      storage: isBrowser ? localStorage : undefined,
      flowType: 'pkce' as const,
    },
    cookieOptions: isLocal ? {
      domain: 'localhost',
      path: '/',
      sameSite: 'lax' as const,
      secure: false,
    } : {
      domain: '.theiaseek.com',
      path: '/',
      sameSite: 'lax' as const,
      secure: true,
    },
  };

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
}