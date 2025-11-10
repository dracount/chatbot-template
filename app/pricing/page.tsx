import PricingContent from "@/components/pricing-content";
import { createSupabaseClient } from "@/utils/supabase/server";
import { PublicHeader } from "@/components/public-header";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_description: string | null;
  paypal_plan_id: string | null;
}

export default async function PricingPage() {
  const supabase = await createSupabaseClient();

  let currentUserPlan: string | null = 'free';

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user plan for pricing page:", profileError);
      currentUserPlan = 'free';
    } else {
      currentUserPlan = profile?.plan ?? 'free';
    }
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true });

    if (productsError || !products) {
    console.error("Error fetching products from Supabase:", productsError);
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        There was an error loading the plans. Please try again later.
      </div>
    );
  }

  return (
    <>
      <PublicHeader />
      <div className="max-w-5xl mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-medium mb-4">A Worthwhile Investment In Yourself</h1>
          <p className="text-lg text-foreground/70">Choose a path that honors your commitment to self-discovery.</p>
        </div>
        
        <PricingContent
          products={products as Product[]}
          currentUserPlan={currentUserPlan}
        />
      </div>
    </>
  );
}