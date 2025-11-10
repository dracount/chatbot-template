// app/payment-success/page.tsx

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';
import { getUserPlan } from '@/app/actions'; // <-- Import our new action

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState('pending'); // 'pending', 'upgraded', 'timeout'

  useEffect(() => {
    // This function will be called every 2 seconds to check the plan status
    const pollPlanStatus = async () => {
      const currentPlan = await getUserPlan();
      console.log('Polling... Current plan is:', currentPlan);
      
      if (currentPlan === 'illuminate') {
        // SUCCESS! The plan has been updated.
        return true;
      }
      return false;
    };

    // 1. Set up an interval to poll every 2 seconds (2000 milliseconds)
    const intervalId = setInterval(async () => {
      const isUpgraded = await pollPlanStatus();
      if (isUpgraded) {
        clearInterval(intervalId); // Stop polling
        clearTimeout(fallbackTimeout); // Cancel the fallback timeout
        setStatus('upgraded');
        
        // Redirect after a short delay so the user can see the success message
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    }, 2000);

    // 2. Set up a fallback timeout.
    // If we're still pending after 20 seconds, stop polling and show a message.
    const fallbackTimeout = setTimeout(() => {
        clearInterval(intervalId); // Stop polling
        if (status === 'pending') {
            setStatus('timeout');
        }
    }, 20000); // 20-second timeout

    // 3. Cleanup function to stop everything if the user navigates away
    return () => {
      clearInterval(intervalId);
      clearTimeout(fallbackTimeout);
    };
  }, [router, status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
        {status === 'upgraded' ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Upgrade Successful!</h1>
            <p className="text-gray-600 mb-6">Your account is now on the Illuminate plan. Redirecting you to the dashboard...</p>
          </>
        ) : status === 'pending' ? (
          <>
            <Loader className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Finalizing Your Upgrade...</h1>
            <p className="text-gray-600 mb-6">Payment was successful. We are now activating your new plan. Please wait a moment.</p>
          </>
        ) : ( // This is the 'timeout' state
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Received!</h1>
            <p className="text-gray-600 mb-6">Your upgrade is being processed and should be active shortly. Click below to go to your dashboard.</p>
            <Link
              href="/"
              className="inline-block bg-black text-white font-semibold py-3 px-8 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}