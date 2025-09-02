import { NextResponse } from 'next/server';

// This function will handle all POST requests sent to this API route.
export async function POST(request: Request) {
  try {
    // 1. Parse the incoming request body as JSON.
    const webhookEvent = await request.json();

    // 2. Log the entire event object to your Vercel logs.
    // This is the most important part for testing.
    console.log('--- PayPal Webhook Received ---');
    console.log(JSON.stringify(webhookEvent, null, 2));
    console.log('-----------------------------');

    // In a real application, you would add logic here to verify the webhook
    // and then update your database. For now, we just log it.

  } catch (error) {
    // If anything goes wrong, log the error.
    console.error('Error processing PayPal webhook:', error);
    // Respond with an error status to let PayPal know something went wrong.
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }

  // 3. Respond to PayPal with a 200 OK status.
  // This is crucial. If you don't respond, PayPal will think your
  // webhook is broken and will keep trying to send the same message.
  return NextResponse.json({ status: 'success' }, { status: 200 });
}