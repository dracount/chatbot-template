'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/client';
import { loadScript } from "@paypal/paypal-js";
import type { PayPalScriptOptions } from "@paypal/paypal-js";
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cancelSubscriptionAction } from '@/app/actions';
import { Check } from 'lucide-react'; // Import Check icon
import { cn } from '@/lib/utils'; // Import cn utility

// --- Interfaces and Components (No changes here) ---

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_description: string | null; // Added for display
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
            style: { shape: 'rect', color: 'black', layout: 'vertical', label: 'subscribe', height: 48 },
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
    <div className="min-h-[50px] w-full">
      {isLoading && <div className="flex justify-center pt-3"><Spinner /></div>}
      <div id={`paypal-button-${planId}`}></div>
    </div>
  );
}

function DowngradeButton() {
  const [isPending, startTransition] = useTransition();

  const handleDowngrade = () => {
    startTransition(async () => {
      const result = await cancelSubscriptionAction();
      if (result.error) {
        alert(`Downgrade failed: ${result.error}`);
      } else {
        alert("Your subscription has been cancelled. Your paid features will remain active until the end of your current billing period.");
      }
    });
  };

  return (
    <Button variant="outline" className="w-full h-12" onClick={handleDowngrade} disabled={isPending}>
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

  const freeFeatures = ["Basic coaching conversations", "Standard response speed", "Community support"];
  const paidFeatures = ["Everything in Free", "Deeper, more incisive coaching", "Access to all AI models", "Save insights to your Insights", "Early access to new features"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch justify-center max-w-4xl mx-auto">
      {products.map((product) => {
        const isCurrentPlan = product.name.toLowerCase() === currentUserPlan;
        const isUserOnPaidPlan = currentUserPlan && currentUserPlan !== 'free';
        const isFreeTier = product.name.toLowerCase() === 'free';
        const features = isFreeTier ? freeFeatures : paidFeatures;

        return (
          <div
            key={product.id}
            className={cn(
              "border rounded-xl p-8 flex flex-col bg-background",
              isCurrentPlan ? 'border-2 border-primary ring-4 ring-primary/10' : 'border-border'
            )}
          >
            <h2 className="text-2xl font-semibold">{product.name}</h2>
            <p className="text-4xl font-bold my-4">{product.price_description}</p>
            <p className="text-muted-foreground mb-8 flex-grow">{product.description}</p>
            
            <ul className="space-y-3 mb-10">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-accent flex-shrink-0 mr-3 mt-1" />
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {isCurrentPlan ? (
                <Button disabled variant="outline" className="w-full h-12">Your Current Plan</Button>
              ) : !isFreeTier && userId ? (
                <PayPalButton userId={userId} planId={product.id} />
              ) : isFreeTier && isUserOnPaidPlan ? (
                <DowngradeButton />
              ) : (
                 <Button variant={isFreeTier ? 'outline' : 'default'} className="w-full h-12" disabled={!userId}>
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