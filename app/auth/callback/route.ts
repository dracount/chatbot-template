import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    console.error('[Callback Route ERROR] OAuth provider returned an error:', error);
    return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=oauth_provider_error&details=${error}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Callback Route ERROR] Code exchange failed:', exchangeError.message);
       return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=oauth_exchange_failed&details=${exchangeError.message}`);
    }
  } else {
     console.error('[Callback Route ERROR] No code found in callback URL.');
     return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=missing_code`);
  }

  // On successful exchange, redirect to a protected page or the welcome page.
  // The session is now stored in cookies and will be available server-side.
  return NextResponse.redirect(`${requestUrl.origin}/welcome`);
}