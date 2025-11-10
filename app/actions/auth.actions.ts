"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/redirect";
import { revalidatePath } from "next/cache";

export const signInAction = async (formData: FormData) => {
  console.log("[signInAction LOG] Action initiated.");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[signInAction LOG] Supabase sign-in failed. Error:", error.message);
    let errorMessage = error.message;
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "We couldn't find an account with these credentials. Please double-check your email and password.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage = "Your email hasn't been verified yet. Please check your inbox.";
    }
    return encodedRedirect("error", "/sign-in", errorMessage);
  }

  const user = data.user;
  if (!user.email_confirmed_at) {
    console.log(`[signInAction LOG] User ${email} email not confirmed. Redirecting to confirmation page.`);
    return encodedRedirect("success", `/confirmation?email=${encodeURIComponent(email)}`, "Please confirm your email to continue.");
  }

  console.log(`[signInAction LOG] User ${user.id} signed in successfully.`);
  revalidatePath('/');
  console.log("[signInAction LOG] Redirecting to /welcome to prepare session.");
  return redirect('/welcome');
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const client = await createSupabaseClient();

  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin}/auth/callback`,
    },
  });

  if (error) {
    let errorMessage = error.message;
    if (error.message.includes("already registered")) {
      errorMessage = "This email is already registered. Please sign in instead.";
    } else if (error.message.includes("weak password")) {
      errorMessage = "Please use a stronger password. It should be at least 6 characters long.";
    }
    return encodedRedirect("error", "/sign-up", errorMessage);
  }

  return redirect(`/confirmation?email=${encodeURIComponent(email)}`);
};

export const signOutAction = async () => {
  const client = await createSupabaseClient();
  await client.auth.signOut();
  return redirect("/sign-in");
};