// D:\PROCESSES\vscode_projects\AI_Lifecoach\chatbot-template\components\pricing-content.tsx

'use client';

import Script from 'next/script';
import PayPalButton from './paypal'; // Use relative path to your paypal.tsx component

interface Product {
  id: string;
  name: string;
  description: string | null;
}

interface PricingContentProps {
  products: Product[];
}

export default function PricingContent({ products }: PricingContentProps) {
  const freeProduct = products.find((p) => p.id === 'plan_free');
  const paidProduct = products.find((p) => p.id === 'plan_paid');

  return (
    <>
      {/* This script loads the PayPal SDK needed for the button to work */}
      <Script
        src="https://www.paypal.com/sdk/js?client-id=AaHjShPcAglIoVF6mCBk1BrX9VnKL0xZOXlwi_upiWgCvrWQ4NoEPrVNBzoEC0jWWmkdODO-MU6HqH82&components=hosted-buttons&disable-funding=venmo&currency=USD"
        strategy="afterInteractive"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center max-w-4xl mx-auto">
        {/* --- REFLECT (Free) TIER --- */}
        {freeProduct && (
          <div className="border rounded-lg p-8 flex flex-col h-full">
            <h2 className="text-2xl font-semibold">{freeProduct.name}</h2>
            <p className="text-4xl font-bold my-4">Free</p>
            <p className="text-gray-500 mb-6 flex-grow">
              {freeProduct.description}
            </p>
            <button
              disabled={true}
              className="mt-auto w-full bg-gray-200 text-gray-500 py-3 rounded-md font-semibold cursor-not-allowed">
              Your Current Plan
            </button>
          </div>
        )}

        {/* --- ILLUMINATE (Paid) TIER --- */}
        {paidProduct && (
          <div className="border-2 border-blue-500 rounded-lg p-8 flex flex-col h-full ring-4 ring-blue-500/20">
            <h2 className="text-2xl font-semibold">{paidProduct.name}</h2>
            <p className="text-4xl font-bold my-4">$10<span className="text-gray-500 text-lg">/month</span></p>
            <p className="text-gray-500 mb-6 flex-grow">
              {paidProduct.description}
            </p>
            <div className="mt-auto min-h-[50px]">
              {/* This renders your PayPal button from components/paypal.tsx */}
              <PayPalButton />
            </div>
          </div>
        )}
      </div>
    </>
  );
}