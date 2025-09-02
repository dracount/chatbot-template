// app/api/generator/webhooks/paypal/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// WARNING: This is a simplified example.
// In a real-world application, you MUST verify the webhook signature.
// See PayPal's documentation on webhook verification.

export async function POST(request: Request) {
  try {
    const event = await request.json();

    // Log the event for debugging
    console.log('--- PayPal Webhook Received ---');
    console.log(JSON.stringify(event, null, 2));

    // Check if it's the event we care about
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const customId = event.resource?.purchase_units[0]?.custom_id;

      if (!customId) {
        console.error('Webhook Error: No custom_id (User ID) found in payload.');
        return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
      }

      console.log(`Payment approved for User ID: ${customId}`);

      // Create a Supabase admin client to update the user's profile
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // --- THE FIX IS HERE ---
      // We removed `data` from the line below because it wasn't being used.
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ plan: 'illuminate' })
        .eq('id', customId);

      if (error) {
        console.error('Supabase update error:', error);
        // We still return a 200 OK so PayPal doesn't retry,
        // but we log the error for manual follow-up.
      } else {
        console.log(`Successfully updated plan for user ${customId} to 'illuminate'.`);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}