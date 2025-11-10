'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/philosophy", label: "Our Story" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <>
      <header className="absolute top-0 left-0 w-full z-20 p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo Link */}
          <Link href="/" className="font-serif text-3xl font-medium text-primary hover:text-primary/80 transition-colors">
            Theia
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-x-8 text-sm">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-foreground/80 hover:text-primary transition-colors font-medium">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Action Button */}
          <Link
            href="/sign-in"
            className="hidden md:inline-flex bg-primary text-primary-foreground font-medium py-2 px-5 rounded-lg text-sm transition-colors hover:bg-primary/90"
          >
            Begin
          </Link>
          
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 -mr-2"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6 text-primary" />
          </button>
        </div>
      </header>
      
      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 p-2"
              aria-label="Close navigation menu"
            >
              <X className="h-8 w-8 text-primary" />
            </button>

            <nav className="flex flex-col items-center gap-y-10 text-center">
              {navLinks.map((link) => (
                 <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="font-serif text-3xl text-primary hover:text-primary/80 transition-colors">
                  {link.label}
                </Link>
              ))}
               <Link href="/sign-in" onClick={() => setIsMenuOpen(false)} className="font-serif text-3xl text-primary hover:text-primary/80 transition-colors mt-4">
                Begin
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}