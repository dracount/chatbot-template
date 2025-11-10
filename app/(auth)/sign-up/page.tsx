"use client";

import { signUpAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Eye, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { createSupabaseClient } from '@/utils/supabase/client';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const handleGoogleSignUp = async () => {
    const supabase = createSupabaseClient();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Supabase OAuth Error:", error.message);
      setErrorMessage(error.message);
    }
  };

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMessage(error);
    }
  }, [searchParams]);

  const handleContinue = (formData: FormData) => {
    const emailValue = formData.get("email") as string;
    if (emailValue) {
      setEmail(emailValue);
      setShowPassword(true);
      setErrorMessage(null);
    }
  };

  // THEIA REDESIGN: Updated styles for consistency
  const inputStyles = "h-12 w-full rounded-lg bg-background border-border focus:border-primary text-base px-4";
  const buttonStyles = "h-12 w-full rounded-lg text-base";

  return (
    <div className="min-h-screen w-full flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-sm">
        <form
          className="w-full space-y-6"
          action={showPassword ? signUpAction : handleContinue}
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {showPassword ? 'Create a password' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground">
              {showPassword ? 'Almost there! Create a secure password.' : 'Begin your journey with Theia.'}
            </p>
          </div>

          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                required
                defaultValue={email}
                readOnly={showPassword}
                className={inputStyles}
              />
              {showPassword && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(false)}
                >
                  Edit
                </button>
              )}
            </div>

            {showPassword && (
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPasswordText ? "text" : "password"}
                  placeholder="Password"
                  required
                  className={`${inputStyles} pr-10`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye size={20} />
                </button>
              </div>
            )}

            <Button type="submit" className={buttonStyles}>
              {showPassword ? 'Create Account' : 'Continue'}
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">OR</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            className={`${buttonStyles} flex items-center justify-center gap-3`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  );
}