// app/payment-success/page.tsx

'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="bg-white p-10 rounded-lg shadow-md max-w-md w-full">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your account is being upgraded now. This may take a moment to reflect.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white font-semibold py-3 px-8 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}