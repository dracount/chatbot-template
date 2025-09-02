// D:\PROCESSES\vscode_projects\AI_Lifecoach\chatbot-template\app\pricing\page.tsx

import PricingContent from "@/components/pricing-content";
import { createSupabaseClient } from "@/utils/supabase/server"; // Use Supabase server client

// Define a simple type for our product data from Supabase
interface Product {
  id: string;
  name: string;
  description: string | null;
}

export default async function PricingPage() {
  const supabase = await createSupabaseClient();

  // Fetch products directly from your Supabase table
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true }); // Order by ID to ensure 'plan_free' is first

  if (error || !products) {
    console.error("Error fetching products from Supabase:", error);
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-600">
        There was an error loading the plans. Please try again later.
      </div>
    );
  }

  // NOTE: We don't need to know the user's current plan on the server anymore,
  // the UI will just show the options.

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-medium mb-4">Choose your plan</h1>
      </div>

      {/* Pass the products from Supabase to the UI component */}
      <PricingContent products={products as Product[]} />
    </div>
  );
}