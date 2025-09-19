// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/app/client.tsx
// chatbot-template/app/client.tsx

"use client";

import { SidebarComponent } from "@/components/sidebar";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getSubscriptionDetails } from "@/app/actions";
import { CheckoutSuccessHandler } from "@/components/checkout-success-handler";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full text-center p-6 bg-transparent text-sm text-gray-500">
      © {year} Clarity | <Link href="#" className="hover:underline">Privacy Policy</Link> | <Link href="/faq" className="hover:underline">FAQ</Link>
    </footer>
  );
};

function ClientLayoutContent({ children }: ClientLayoutProps) {
  //const [showSidebar, setShowSidebar] = useState(false);
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [activePlanName, setActivePlanName] = useState<string | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (isAuthenticated) {
        setIsSubscriptionLoading(true);
        try {
          const details = await getSubscriptionDetails();
          setActivePlanName(details.planName);
        } catch (error) {
          console.error("Error fetching subscription status:", error);
        } finally {
          setIsSubscriptionLoading(false);
        }
      }
    };
    fetchSubscriptionStatus();
  }, [isAuthenticated]);

  const isFullScreenPage =
    pathname === '/' ||
    pathname === '/how-it-works' ||
    pathname === '/philosophy' ||
    pathname === '/faq' ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname === '/pricing' ||
    pathname === '/confirmation' ||
    pathname?.startsWith('/confirmation');

  const isChatPage = pathname?.startsWith('/c/');

  // The toggle function remains the same.
  //const toggleSidebar = () => setShowSidebar(!showSidebar);

  // If it's a full-screen page, render it without any layout.
  if (isFullScreenPage) {
    return (
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      );
  }

  // --- THIS IS THE NEW, SIMPLIFIED, AND CORRECT LAYOUT ---
  // For any page that is NOT a full-screen page, render the sidebar layout.
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <CheckoutSuccessHandler />
      <Toaster richColors />
      {/* A single flex container for the whole screen */}
      <div className="flex h-screen w-screen">
        {/* The Sidebar component is a direct child */}
        <SidebarComponent
          isAuthenticated={isAuthenticated}
          activePlanName={activePlanName}
          isSubscriptionLoading={isSubscriptionLoading}
        />

        {/* The main content area is the other direct child, taking up the remaining space */}
        <main className={cn("flex-1 overflow-hidden", isChatPage && "starfield-background")}>
          {/* This inner div handles all scrolling, preventing the main layout from breaking */}
          <div className="h-full w-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

  export function ClientLayout({ children }: ClientLayoutProps) {
    return (
      <AuthProvider>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </AuthProvider>
    );
  }