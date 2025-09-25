// app/auth/callback/route.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("[Callback LOG] Received code:", code ? "present" : "missing");

  if (code) {
    // Create response first
    let response = NextResponse.redirect(new URL("/welcome", request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      console.log("[Callback LOG] Exchange result:", {
        success: !error,
        userId: session?.user?.id,
        error: error?.message
      });

      if (error) {
        console.error("[Callback ERROR] Exchange failed:", error);
        response = NextResponse.redirect(new URL("/sign-in?error=oauth_exchange_failed", request.url));
        return response;
      }

      // Confirm session after exchange
      const { data: currentSession } = await supabase.auth.getSession();
      console.log("[Callback LOG] Session after exchange:", {
        hasSession: !!currentSession.session,
        userId: currentSession.session?.user?.id
      });

      // Revalidate the root path to refresh client state
      revalidatePath("/");

      return response;
    } catch (err) {
      console.error("[Callback ERROR] Unexpected error:", err);
      response = NextResponse.redirect(new URL("/sign-in?error=unexpected", request.url));
      return response;
    }
  } else {
    console.log("[Callback LOG] No code, redirecting to sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}