// D:\PROCESSES\vscode_projects\AI_Lifecoach\chatbot-template\components\pricing-content.tsx

'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase/client'; // Import Supabase client

// Interface for a single product from Supabase
interface Product {
  id: string;
  name: string;
  description: string | null;
}

// Interface for the component's props
interface PricingContentProps {
  products: Product[];
}

export default function PricingContent({ products }: PricingContentProps) {
  const supabase = createSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);

  // On component load, get the current user's ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase]);

  const freeProduct = products.find((p) => p.id === 'plan_free');
  const paidProduct = products.find((p) => p.id === 'plan_paid');

  // +++ CHANGE IS HERE +++
  // Construct the dynamic PayPal link with the user's ID
  // The 'custom_id' is how we'll identify the user in the webhook!
  const basePaymentLink = `https://www.sandbox.paypal.com/ncp/payment/K5TZYYUSFX672`;
  const paymentLink = userId ? `${basePaymentLink}?custom_id=${userId}` : '#';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center max-w-4xl mx-auto">
      {/* --- REFLECT (Free) TIER --- */}
      {freeProduct && (
        <div className="border rounded-lg p-8 flex flex-col h-full">
          <h2 className="text-2xl font-semibold">{freeProduct.name}</h2>
          <p className="text-4xl font-bold my-4">Free</p>
          <p className="text-gray-500 mb-6 flex-grow">{freeProduct.description}</p>
          <button
            disabled={true}
            className="mt-auto w-full bg-gray-200 text-gray-500 py-3 rounded-md font-semibold cursor-not-allowed"
          >
            Your Current Plan
          </button>
        </div>
      )}

      {/* --- ILLUMINATE (Paid) TIER --- */}
      {paidProduct && (
        <div className="border-2 border-blue-500 rounded-lg p-8 flex flex-col h-full ring-4 ring-blue-500/20">
          <h2 className="text-2xl font-semibold">{paidProduct.name}</h2>
          <p className="text-4xl font-bold my-4">$10<span className="text-gray-500 text-lg">/month</span></p>
          <p className="text-gray-500 mb-6 flex-grow">{paidProduct.description}</p>
          <div className="mt-auto min-h-[50px]">
            {/* The simple payment button */}
            <a
              // +++ AND HERE +++
              href={paymentLink}
              target="_blank" // Opens PayPal in a new tab
              rel="noopener noreferrer"
              className={`w-full text-center block py-3 rounded-md font-semibold text-white transition-colors ${
                userId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {userId ? 'Upgrade to Illuminate' : 'Loading...'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}