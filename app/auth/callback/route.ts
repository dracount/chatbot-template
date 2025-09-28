// In app/auth/callback/route.ts

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
    return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=oauth_provider_error&details=${encodeURIComponent(error)}`);
  }

  if (code) {
    // Correctly await the cookies() function to get the cookie store object
    const cookieStore = await cookies(); 

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // Now that cookieStore is the resolved object, these sync functions will work
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          // Use a try-catch for robustness, as recommended by Supabase SSR docs
          set(name: string, value: string, options) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Callback Route ERROR] Code exchange failed:', exchangeError.message);
       return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=oauth_exchange_failed&details=${encodeURIComponent(exchangeError.message)}`);
    }
  } else {
     console.error('[Callback Route ERROR] No code found in callback URL.');
     return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=missing_code`);
  }

  // On successful exchange, redirect to the welcome page to set up the session.
  return NextResponse.redirect(`${requestUrl.origin}/welcome`);
}