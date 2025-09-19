// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/components/public-header.tsx
// In components/public-header.tsx

import Link from 'next/link';

export function PublicHeader() {
  return (
    <header className="absolute top-0 left-0 w-full z-20 p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Link */}
        <Link href="/" className="font-serif text-2xl font-bold text-[#1a1a1a] hover:text-[#333333] transition-colors">
          Clarity
        </Link>

        {/* Right-aligned group for nav and button */}
        <div className="flex items-center gap-x-8">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-x-8 text-sm">
            <Link href="/how-it-works" className="text-[#333333] hover:text-[#1a1a1a] transition-colors font-medium">
              Methodology
            </Link>
            <Link href="/philosophy" className="text-[#333333] hover:text-[#1a1a1a] transition-colors font-medium">
              Philosophy
            </Link>
            <Link href="/pricing" className="text-[#333333] hover:text-[#1a1a1a] transition-colors font-medium">
              Pricing
            </Link>
          </nav>

          {/* Action Button */}
          <Link
            href="/sign-in"
            className="bg-[#1a1a1a] text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors hover:bg-[#333333]"
          >
            Begin
          </Link>
        </div>
      </div>
    </header>
  );
}