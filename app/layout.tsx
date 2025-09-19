import type { Metadata } from "next";
import "./globals.css";
import { Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import { ClientLayout } from "./client";

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-serif-jp',
});

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

// --- UPDATED METADATA OBJECT ---
export const metadata: Metadata = {
  title: "Clarity",
  description: "Clarity is not found. It is uncovered.",
  
  
  // This links the web app manifest file.
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSerif.variable} ${notoSans.variable}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}