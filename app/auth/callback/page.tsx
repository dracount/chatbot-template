// app/auth/callback/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/client';
import { Session, AuthError } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (error || errorDescription) {
      console.error('[Callback Page ERROR] OAuth provider error:', { error, errorDescription });
      router.push(`/sign-in?error=oauth_provider_error&details=${encodeURIComponent(errorDescription || error || 'Unknown')}`);
      return;
    }

    if (code) {
      console.log('[Callback Page LOG] Exchanging code for session...');
      const supabase = createSupabaseClient();

      supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error: exchangeError }: { data: { session: Session | null }, error: AuthError | null }) => {
        console.log('[Callback Page LOG] Exchange result:', {
          success: !exchangeError,
          userId: session?.user?.id,
          error: exchangeError?.message
        });

        if (exchangeError) {
          console.error('[Callback Page ERROR] Exchange failed:', exchangeError);
          router.push(`/sign-in?error=oauth_exchange_failed&details=${encodeURIComponent(exchangeError.message)}`);
        } else {
          console.log('[Callback Page LOG] Session set, redirecting to welcome');
          router.push('/welcome');
        }
      }).catch((err: Error) => {
        console.error('[Callback Page ERROR] Unexpected exchange error:', err);
        router.push('/sign-in?error=unexpected');
      });
    } else {
      console.log('[Callback Page LOG] No code, redirecting to sign-in');
      router.push('/sign-in');
    }
  }, [code, error, errorDescription, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>Authenticating...</p>
        {/* Optional: Add spinner component */}
      </div>
    </div>
  );
}