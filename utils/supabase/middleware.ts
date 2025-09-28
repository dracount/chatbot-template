export const runtime = 'nodejs';

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  console.log("[Middleware LOG] Fetching user for path:", request.nextUrl.pathname);
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("[Middleware LOG] User fetch result for", request.nextUrl.pathname, ":", { userId: user?.id, error: error?.message });
  
  if (request.nextUrl.pathname.startsWith("/protected") && error) {
    console.log("[Middleware LOG] Redirecting to sign-in from protected path due to auth error.");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  
  return supabaseResponse;
}
