// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/app/client.tsx
"use client";

import { SidebarComponent } from "@/components/sidebar";
import { ThemeProvider } from "next-themes";
import { useState, useEffect, Suspense } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getSubscriptionDetails } from "@/app/actions";
import { CheckoutSuccessHandler } from "@/components/checkout-success-handler";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

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

// This component contains the hooks that need to be suspended.
function ClientLayoutContent({ children }: ClientLayoutProps) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [activePlanName, setActivePlanName] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (isAuthenticated) {
        try {
          const details = await getSubscriptionDetails();
          setActivePlanName(details.planName);
        } catch (error) {
          console.error("Error fetching subscription status:", error);
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

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <CheckoutSuccessHandler />
      <Toaster richColors />
      <div className="flex h-screen w-screen">
        <SidebarComponent
          isAuthenticated={isAuthenticated}
          activePlanName={activePlanName}
        />
        <main className={cn("flex-1 overflow-hidden", isChatPage && "starfield-background")}>
          <div className="h-full w-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

// The Suspense boundary is now placed here, wrapping the component that uses the client-side hooks.
export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </Suspense>
    </AuthProvider>
  );
}