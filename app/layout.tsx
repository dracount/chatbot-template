import type { Metadata, Viewport } from "next"; // Import Viewport
import "./globals.css";
import { Lora, Inter } from "next/font/google";
import { ClientLayout } from "./client";

const lora = Lora({
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-lora',
});

const inter = Inter({
  subsets: ["latin"],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Theia - Your AI Master Coach",
  description: "Stop seeking answers. Start accessing your own wisdom.",
  manifest: '/site.webmanifest',
};

// THEIA REDESIGN - VIEWPORT EXPORTED SEPARATELY
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lora.variable} ${inter.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}