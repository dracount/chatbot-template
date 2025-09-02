'use client';

import React, { useEffect } from 'react';

// --- FIX 1: Define a specific type for the PayPal object ---
// Instead of `any`, we describe the exact functions we plan to use.
interface PayPalHostedButtons {
  render: (selector: string) => Promise<void>;
}

interface PayPalNamespace {
  HostedButtons: (options: { hostedButtonId: string }) => PayPalHostedButtons;
}

// Apply this new, specific type to the global window object.
declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

const PayPalButton = () => {
  useEffect(() => {
    if (window.paypal) {
      window.paypal.HostedButtons({
        hostedButtonId: "22GTVFW6WHDR6",
      }).render("#paypal-container-22GTVFWHDR6")
      // --- FIX 2: Type the error in the catch block as `unknown` ---
      // This is the modern, safe way to handle errors in TypeScript.
      .catch((err: unknown) => {
        console.error("PayPal button failed to render.", err);
      });
    }
  }, []);

  return <div id="paypal-container-22GTVFWHDR6" />;
};

export default PayPalButton;