'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/client';
import { loadScript } from "@paypal/paypal-js";
import type { PayPalScriptOptions, OnApproveData, CreateSubscriptionActions } from "@paypal/paypal-js";
import { Button } from '@/components/ui/button'; // Import the Button component
import { Spinner } from '@/components/ui/spinner'; // Import a spinner for better UX

// Interface for a single product from Supabase
interface Product {
  id: string; // e.g., 'plan_free', 'plan_paid'
  name: string;
  description: string | null;
}

// Interface for the component's props
interface PricingContentProps {
  products: Product[];
  currentUserPlan: string | null; // This prop is now essential
}

export default function PricingContent({ products, currentUserPlan }: PricingContentProps) {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isPayPalReady, setIsPayPalReady] = useState(false);

  // Find the specific products from the props
  const freeProduct = products.find((p) => p.id === 'plan_free');
  const paidProduct = products.find((p) => p.id === 'plan_paid');

  // --- NEW LOGIC: Determine if the paid plan is currently active ---
  // We check if the currentUserPlan matches the ID of the paid product.
  const isPaidPlanActive = currentUserPlan === paidProduct?.id;

  // This useEffect fetches the user ID, which is needed for the PayPal custom_id.
  // This logic does not need to change.
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase]);

  // This useEffect loads and renders the PayPal button.
  // It should ONLY run if the paid plan is NOT active.
  useEffect(() => {
    // --- NEW LOGIC: If user already has the paid plan, do not load PayPal ---
    if (!userId || isPaidPlanActive) {
      return;
    }

    let isMounted = true;

    const paypalOptions: PayPalScriptOptions = {
      clientId: "AaHjShPcAglIoVF6mCBk1BrX9VnKL0xZOXlwi_upiWgCvrWQ4NoEPrVNBzoEC0jWWmkdODO-MU6HqH82",
      vault: true,
      intent: "subscription",
    };

    setIsPayPalReady(false); // Set to false initially on each run
    loadScript(paypalOptions)
      .then((paypal) => {
        if (isMounted && paypal?.Buttons) {
          const container = document.getElementById('paypal-button-container');
          // Clear container before rendering to avoid duplicates
          if(container) container.innerHTML = "";

          paypal.Buttons({
            style: {
              shape: 'rect',
              color: 'white',
              layout: 'vertical',
              label: 'subscribe'
            },
            createSubscription: function(_data, actions: CreateSubscriptionActions) {
              return actions.subscription.create({
                plan_id: 'P-84N15354J7002974TNC4AMVY', // This is your hardcoded PayPal Plan ID
                custom_id: userId
              });
            },
            onApprove: async function(data: OnApproveData) {
              console.log('Subscription approved:', data.subscriptionID);
              router.push('/payment-success');
            },
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
  // We add isPaidPlanActive to the dependency array to re-evaluate if the plan changes.
  }, [userId, router, isPaidPlanActive]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center max-w-4xl mx-auto">
      {/* --- FREE TIER CARD --- */}
      {freeProduct && (
        <div className="border rounded-lg p-8 flex flex-col h-full">
          <h2 className="text-2xl font-semibold">{freeProduct.name}</h2>
          <p className="text-4xl font-bold my-4">Free</p>
          <p className="text-gray-500 mb-6 flex-grow">{freeProduct.description}</p>

          {/* --- NEW CONDITIONAL BUTTON FOR FREE PLAN --- */}
          <div className="mt-auto">
            {isPaidPlanActive ? (
              <Button variant="outline" className="w-full" disabled>
                {/* This button could eventually handle downgrades */}
                Switch to Free
              </Button>
            ) : (
              <Button disabled className="w-full">
                Your Current Plan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* --- PAID TIER CARD --- */}
      {paidProduct && (
        <div className="border-2 border-blue-500 rounded-lg p-8 flex flex-col h-full ring-4 ring-blue-500/20">
          <h2 className="text-2xl font-semibold">{paidProduct.name}</h2>
          <p className="text-4xl font-bold my-4">$10<span className="text-gray-500 text-lg">/month</span></p>
          <p className="text-gray-500 mb-6 flex-grow">{paidProduct.description}</p>
          
          {/* --- NEW CONDITIONAL CONTENT FOR PAID PLAN --- */}
          <div className="mt-auto min-h-[50px]">
            {isPaidPlanActive ? (
              <Button disabled className="w-full">
                Your Current Plan
              </Button>
            ) : (
              <>
                {/* Show a loading state while PayPal SDK loads */}
                {!isPayPalReady && userId && (
                    <div className="flex items-center justify-center">
                        <Spinner />
                        <span className="ml-2 text-gray-500">Loading Payment...</span>
                    </div>
                )}
                {/* The PayPal button will be rendered here by the useEffect */}
                <div id="paypal-button-container"></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}