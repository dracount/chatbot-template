// src/components/PayPalButton.tsx

'use client'; // This component interacts with the browser's window object, so it must be a Client Component.

import React, { useEffect } from 'react';

// Define the type for the window.paypal object for TypeScript
declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalButton = () => {
  useEffect(() => {
    // This effect runs when the component mounts.
    // We check if the global `paypal` object from the SDK script is available.
    if (window.paypal) {
      window.paypal.HostedButtons({
        hostedButtonId: "22GTVFW6WHDR6",
      }).render("#paypal-container-22GTVFW6WHDR6")
      .catch((err: any) => {
        // Optional: Add error handling for developers
        console.error("PayPal button failed to render.", err);
      });
    }
  }, []); // The empty dependency array means this effect runs only once after the initial render.

  // This is the container where the PayPal button will be injected by the script.
  return <div id="paypal-container-22GTVFW6WHDR6" />;
};

export default PayPalButton;