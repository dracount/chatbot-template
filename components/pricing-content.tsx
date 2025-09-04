'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/client';
import { loadScript } from "@paypal/paypal-js";
import type { PayPalScriptOptions, OnApproveData, CreateSubscriptionActions } from "@paypal/paypal-js";
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// Define the shape of our Product object, now including the PayPal Plan ID
interface Product {
  id: string; // 'free', 'illuminate', 'premium'
  name: string;
  description: string | null;
  price_description: string | null; // e.g., "Free", "$10/month"
  paypal_plan_id: string | null; // The corresponding ID from PayPal
}

interface PricingContentProps {
  products: Product[];
  currentUserPlan: string | null;
}

// A smaller, reusable component for the PayPal button
function PayPalButton({ userId, product }: { userId: string; product: Product }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If there's no PayPal plan ID for this product, do nothing.
    if (!product.paypal_plan_id) return;

    let isMounted = true;
    const paypalOptions: PayPalScriptOptions = {
      clientId: "AaHjShPcAglIoVF6mCBk1BrX9VnKL0xZOXlwi_upiWgCvrWQ4NoEPrVNBzoEC0jWWmkdODO-MU6HqH82",
      vault: true,
      intent: "subscription",
    };

    loadScript(paypalOptions)
      .then((paypal) => {
        if (isMounted && paypal?.Buttons) {
          const containerId = `#paypal-button-${product.id}`;
          const container = document.querySelector(containerId);
          if (container) container.innerHTML = ""; // Clear previous buttons

          paypal.Buttons({
            style: { shape: 'rect', color: 'white', layout: 'vertical', label: 'subscribe' },
            // --- FIX IS HERE ---
            createSubscription: function(_data, actions: CreateSubscriptionActions) {
              return actions.subscription.create({
                plan_id: product.paypal_plan_id!, // Use the dynamic plan ID from the product
                custom_id: userId
              });
            },
            // --- AND FIX IS HERE ---
            onApprove: async function(_data: OnApproveData) {
              router.push('/payment-success');
            },
            onError: function (err: unknown) {
              console.error('PayPal button error:', err);
            }
          }).render(containerId);
          
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load PayPal SDK:", err);
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [userId, product, router]);

  if (!product.paypal_plan_id) return null;

  return (
    <div className="min-h-[50px]">
      {isLoading && (
        <div className="flex items-center justify-center">
          <Spinner /><span className="ml-2 text-gray-500">Loading...</span>
        </div>
      )}
      <div id={`paypal-button-${product.id}`}></div>
    </div>
  );
}

// --- Main Pricing Page Component ---
export default function PricingContent({ products, currentUserPlan }: PricingContentProps) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start justify-center max-w-6xl mx-auto">
      {/* We now map over ALL products and render a card for each one */}
      {products.map((product) => {
        const isCurrentPlan = product.id === currentUserPlan;
        const isPaidProduct = !!product.paypal_plan_id;

        return (
          <div 
            key={product.id}
            className={`border rounded-lg p-8 flex flex-col h-full ${isCurrentPlan ? 'border-2 border-blue-500 ring-4 ring-blue-500/20' : ''}`}
          >
            <h2 className="text-2xl font-semibold">{product.name}</h2>
            <p className="text-4xl font-bold my-4">{product.price_description}</p>
            <p className="text-gray-500 mb-6 flex-grow">{product.description}</p>
            
            <div className="mt-auto">
              {isCurrentPlan ? (
                <Button disabled className="w-full">Your Current Plan</Button>
              ) : (
                // If it's a paid product, show the PayPal button.
                // The user must be logged in (userId is not null)
                isPaidProduct && userId ? (
                  <PayPalButton userId={userId} product={product} />
                ) : (
                  // Handle other cases, e.g., a "downgrade" button or nothing
                  <Button variant="outline" className="w-full" disabled={!userId}>
                    {userId ? 'Select Plan' : 'Log in to select'}
                  </Button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}