import PricingContent from "@/components/pricing-content";
import { createSupabaseClient } from "@/utils/supabase/server";

interface Product {
  id: string; // This should correspond to the plan name, e.g., 'illuminate'
  name: string;
  description: string | null;
}

export default async function PricingPage() {
  const supabase = await createSupabaseClient();

  // --- START OF NEW LOGIC ---

  let currentUserPlan: string | null = 'free'; // Default to 'free'

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // 2. If user exists, get their plan from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user plan for pricing page:", profileError);
    } else {
      currentUserPlan = profile?.plan ?? 'free';
    }
  }

  // --- END OF NEW LOGIC ---

  // Fetch all available products (this part is the same as before)
  const { data: products, error } = await supabase
    .from('products') // Assuming you have a 'products' table in Supabase
    .select('*')
    .order('id', { ascending: true });

  if (error || !products) {
    console.error("Error fetching products from Supabase:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-600">
        There was an error loading the plans. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium mb-4">Choose your plan</h1>
      </div>

      {/* 
        * NOW, we pass BOTH the list of all products AND the user's current plan 
        * to the UI component.
      */}
      <PricingContent 
        products={products as Product[]} 
        currentUserPlan={currentUserPlan} 
      />
    </div>
  );
}