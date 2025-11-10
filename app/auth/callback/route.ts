// In app/auth/callback/route.ts

import { createSupabaseClient } from '@/utils/supabase/server';
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
    const supabase = await createSupabaseClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Callback Route ERROR] Code exchange failed:', exchangeError.message);
       return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=oauth_exchange_failed&details=${encodeURIComponent(exchangeError.message)}`);
    }
  } else {
     console.error('[Callback Route ERROR] No code found in callback URL.');
     return NextResponse.redirect(`${requestUrl.origin}/sign-in?error=missing_code`);
  }

  return NextResponse.redirect(`${requestUrl.origin}/welcome`);
}