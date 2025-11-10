"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createUpdateClient } from "@/utils/update/server";

export async function createCheckout(priceId: string) {
  "use server";

  const client = await createUpdateClient();
  const { data, error } = await client.billing.createCheckoutSession(
    priceId,
    { redirect_url: `${new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin}/account?checkout=success` }
  );

  if (error) {
    throw new Error("Failed to create checkout session");
  }

  return redirect(data.url);
}

export async function getSubscriptionDetails(): Promise<{
  planName: string | null;
  subscriptionId: string | null;
  canUpgrade: boolean;
  renewalDate: string | null;
  isCancelled: boolean;
}> {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { planName: null, subscriptionId: null, canUpgrade: true, renewalDate: null, isCancelled: false };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error("Error fetching user profile:", error);
      return { planName: 'free', subscriptionId: null, canUpgrade: true, renewalDate: null, isCancelled: false };
    }

    const planName = profile.plan;
    const canUpgrade = planName === 'free';

    return {
      planName,
      subscriptionId: null,
      canUpgrade,
      renewalDate: null,
      isCancelled: false
    };
  } catch (err) {
    console.error("Unexpected error checking subscription details:", err);
    return { planName: null, subscriptionId: null, canUpgrade: true, renewalDate: null, isCancelled: false };
  }
}

export async function reactivateSubscriptionAction(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  if (!subscriptionId) {
    return { success: false, error: "Subscription ID is required." };
  }
  try {
    const updateClient = await createUpdateClient();
    const { error } = await updateClient.billing.updateSubscription(subscriptionId, {
      cancel_at_period_end: false,
    });

    if (error) {
      console.error("Error reactivating subscription:", error);
      return { success: false, error: error.message || "Failed to reactivate subscription." };
    }

    revalidatePath("/");
    revalidatePath("/pricing");

    return { success: true };
  } catch (err: unknown) {
    console.error("Unexpected error reactivating subscription:", err);
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function cancelSubscriptionAction(): Promise<{ success: boolean; error?: string }> {
  'use server';

  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('paypal_subscription_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.paypal_subscription_id) {
    console.error("Downgrade Error: Could not find subscription ID for user.", { userId: user.id, profileError });
    return { success: false, error: "Could not find an active subscription to cancel." };
  }

  const subscriptionId = profile.paypal_subscription_id;
  const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

  if (!NEXT_PUBLIC_PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error("Downgrade Error: Missing PayPal environment variables on the server.");
      return { success: false, error: "Server configuration error." };
  }

  const auth = Buffer.from(`${NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  let accessToken;
  try {
    const tokenResponse = await fetch(`https://api.sandbox.paypal.com/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("PayPal Auth Error:", tokenData);
      return { success: false, error: "Failed to authenticate with PayPal." };
    }
    accessToken = tokenData.access_token;
  } catch (e) {
    console.error("Network error during PayPal Auth:", e);
    return { success: false, error: "Failed to connect to PayPal." };
  }

  try {
    const cancelResponse = await fetch(`https://api.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'User requested cancellation from app.' }),
    });

    if (cancelResponse.status !== 204) {
      const errorBody = await cancelResponse.json();
      console.error("PayPal Cancellation Error:", errorBody);
      return { success: false, error: "PayPal failed to cancel the subscription." };
    }
  } catch (e) {
    console.error("Network error during PayPal Cancellation:", e);
    return { success: false, error: "Failed to connect to PayPal for cancellation." };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ plan: 'free', paypal_subscription_id: null })
    .eq('id', user.id);

  if (updateError) {
    console.error("Critical Error: PayPal subscription cancelled, but Supabase update failed.", { userId: user.id, updateError });
    return { success: false, error: "Downgrade succeeded but a database error occurred. Please contact support." };
  }

  revalidatePath("/pricing");
  revalidatePath("/");
  return { success: true };
}