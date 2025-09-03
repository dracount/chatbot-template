'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/client';

import { loadScript } from "@paypal/paypal-js";
import type { PayPalScriptOptions, OnApproveData, OnApproveActions, CreateSubscriptionActions } from "@paypal/paypal-js";

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
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isPayPalReady, setIsPayPalReady] = useState(false);

  const freeProduct = products.find((p) => p.id === 'plan_free');
  const paidProduct = products.find((p) => p.id === 'plan_paid');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const paypalOptions: PayPalScriptOptions = {
      clientId: "AaHjShPcAglIoVF6mCBk1BrX9VnKL0xZOXlwi_upiWgCvrWQ4NoEPrVNBzoEC0jWWmkdODO-MU6HqH82",
      vault: true,
      intent: "subscription",
    };

    loadScript(paypalOptions)
    .then((paypal) => {
        if (isMounted && paypal?.Buttons) {
            paypal.Buttons({
                style: {
                    shape: 'rect',
                    color: 'white',
                    layout: 'vertical',
                    label: 'subscribe'
                },
                // FIXED: The unused 'data' param is prefixed with an underscore
                createSubscription: function(_data, actions: CreateSubscriptionActions) {
                    return actions.subscription.create({
                        plan_id: 'P-84N15354J7002974TNC4AMVY',
                        custom_id: userId
                    });
                },
                onApprove: async function(data: OnApproveData) {
                    console.log('Subscription approved:', data.subscriptionID);
                    router.push('/payment-success');
                },
                // FIXED: The 'err' parameter is now typed as 'unknown'
                onError: function (err: unknown) {
                    console.error('PayPal button error:', err);
                }
            }).render('#paypal-button-container');

            setIsPayPalReady(true);
        }
    })
    .catch((err) => {
        console.error("Failed to load the PayPal JS SDK script:", err);
    });

    return () => {
      isMounted = false;
      const container = document.getElementById('paypal-button-container');
      if (container) container.innerHTML = "";
    };

  }, [userId, router]);

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
            {!isPayPalReady && userId && <div className="text-center text-gray-500">Loading Payment Options...</div>}
            
            <div id="paypal-button-container"></div>
          </div>
        </div>
      )}
    </div>
  );
}