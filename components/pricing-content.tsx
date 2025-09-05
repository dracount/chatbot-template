'use client';

// --- FIX IS HERE: 'useTransition' is now correctly imported from 'react' ---
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/client';
import { loadScript } from "@paypal/paypal-js";
import type { PayPalScriptOptions } from "@paypal/paypal-js";
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cancelSubscriptionAction } from '@/app/actions';

// --- Interfaces and Components (No changes here) ---

interface Product {
  id: string;
  name: string;
  description: string | null;
}

interface PricingContentProps {
  products: Product[];
  currentUserPlan: string | null;
}

function PayPalButton({ userId, planId }: { userId: string; planId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const paypalOptions: PayPalScriptOptions = {
      clientId: "AaHjShPcAglIoVF6mCBk1BrX9VnKL0xZOXlwi_upiWgCvrWQ4NoEPrVNBzoEC0jWWmkdODO-MU6HqH82",
      vault: true,
      intent: "subscription",
    };

    loadScript(paypalOptions)
      .then((paypal) => {
        if (isMounted && paypal?.Buttons) {
          const containerId = `#paypal-button-${planId}`;
          const container = document.querySelector(containerId);
          if (container) container.innerHTML = "";

          paypal.Buttons({
            style: { shape: 'rect', color: 'white', layout: 'vertical', label: 'subscribe' },
            createSubscription: function(_data, actions) {
              return actions.subscription.create({
                plan_id: 'P-84N15354J7002974TNC4AMVY',
                custom_id: userId
              });
            },
            onApprove: async function(_data) {
              router.push('/payment-success');
            },
          }).render(containerId);
          
          setIsLoading(false);
        }
      })
      .catch((err) => console.error("Failed to load PayPal SDK:", err));

    return () => { isMounted = false; };
  }, [userId, planId, router]);

  return (
    <div className="min-h-[50px]">
      {isLoading && <div className="flex justify-center"><Spinner /></div>}
      <div id={`paypal-button-${planId}`}></div>
    </div>
  );
}

// --- Downgrade Button Component ---
function DowngradeButton() {
  // This line caused the error. It now works because useTransition is imported.
  const [isPending, startTransition] = useTransition();

  const handleDowngrade = () => {
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result.error) {
        // You can replace alert with a more user-friendly notification system
        alert(`Downgrade failed: ${result.error}`);
      } else {
        alert("Your subscription has been cancelled. Your paid features will remain active until the end of your current billing period.");
      }
    });
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleDowngrade} disabled={isPending}>
      {isPending ? <Spinner /> : 'Downgrade to Free'}
    </Button>
  );
}

// --- Main Component ---
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center max-w-4xl mx-auto">
      {products.map((product) => {
        const isCurrentPlan = product.id === currentUserPlan;
        const isUserOnPaidPlan = currentUserPlan && currentUserPlan !== 'plan_free';

        return (
          <div 
            key={product.id}
            className={`border rounded-lg p-8 flex flex-col h-full ${isCurrentPlan ? 'border-2 border-blue-500 ring-4 ring-blue-500/20' : ''}`}
          >
            <h2 className="text-2xl font-semibold">{product.name}</h2>
            <p className="text-gray-500 my-6 flex-grow">{product.description}</p>
            
            <div className="mt-auto">
              {isCurrentPlan ? (
                <Button disabled className="w-full">Your Current Plan</Button>
              ) : product.id === 'illuminate' && userId ? (
                <PayPalButton userId={userId} planId={product.id} />
              ) : product.id === 'plan_free' && isUserOnPaidPlan ? (
                <DowngradeButton />
              ) : (
                <Button variant="outline" className="w-full" disabled={!userId}>
                  {userId ? 'Select Plan' : 'Log in to select'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}