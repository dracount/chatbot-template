'use client';

import React, { useEffect } from 'react';

// Define a specific type for the PayPal object to satisfy the linter.
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
        hostedButtonId: "K5TZYYUSFX672",
      })
      // Correct ID with the "W"
      .render("#paypal-container-22GTVFW6WHDR6") 
      // Type the error as `unknown` which is the modern, safe way.
      .catch((err: unknown) => {
        console.error("PayPal button failed to render.", err);
      });
    }
  }, []);

  // Correct ID with the "W"
  return <div id="paypal-container-22GTVFW6WHDR6" />; 
};

export default PayPalButton;