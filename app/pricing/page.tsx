import PricingContent from "@/components/pricing-content";
import { createSupabaseClient } from "@/utils/supabase/server";

// Define the shape of a Product to match our database table,
// ensuring type safety when we pass props.
interface Product {
  id: string;
  name: string;
  description: string | null;
  price_description: string | null;
  paypal_plan_id: string | null;
}

export default async function PricingPage() {
  const supabase = await createSupabaseClient();

  let currentUserPlan: string | null = 'free'; // Default to 'free' for logged-out users

  // 1. Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If a user is logged in, fetch their specific plan from their profile
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user plan for pricing page:", profileError);
      // In case of error, we can fall back to 'free'
      currentUserPlan = 'free'; 
    } else {
      // Set the user's current plan from their profile, defaulting to 'free' if null
      currentUserPlan = profile?.plan ?? 'free';
    }
  }

  // 3. Fetch the complete list of all available products from the 'products' table.
  // The 'order by' clause can be used to control the display order on the page.
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true }); // Example: order by price to show Free first
    
    console.log("[SERVER LOG] Fetched User Plan:", currentUserPlan);
    console.log("[SERVER LOG] Fetched Products:", products);

  // Handle the case where products fail to load
  if (productsError || !products) {
    console.error("Error fetching products from Supabase:", productsError);
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-600">
        There was an error loading the plans. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium mb-4">Choose Your Plan</h1>
        <p className="text-lg text-gray-500">Select the plan that best fits your needs.</p>
      </div>

      {/* 
        * Pass the full list of products and the user's current plan string
        * down to the client component. The client component will handle the rest.
      */}
      <PricingContent 
        products={products as Product[]} 
        currentUserPlan={currentUserPlan} 
      />
    </div>
  );
}