// Replace the entire POST function in app/api/webhooks/paypal/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const event = await request.json();
    console.log('--- PayPal Webhook Received ---');
    
    // Only act on the definitive subscription activation event.
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      
      const resource = event.resource;
      const customId = resource?.custom_id; // This is the Supabase User ID
      const subscriptionId = resource?.id;   // This is the correct Subscription ID (e.g., "I-...")

      if (!customId || !subscriptionId) {
        console.error('Webhook Error: Missing custom_id or subscription_id in payload.');
        return NextResponse.json({ error: 'Required data missing' }, { status: 400 });
      }

      console.log(`Subscription ACTIVATED for User ID: ${customId} with Subscription ID: ${subscriptionId}`);

      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Save BOTH the plan and the correct subscription ID
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          plan: 'illuminate',
          paypal_subscription_id: subscriptionId 
        })
        .eq('id', customId);

      if (error) {
        console.error('Supabase update error after subscription activation:', error);
      } else {
        console.log(`Successfully updated profile for user ${customId}.`);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}


