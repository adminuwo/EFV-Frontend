'use client';

import { useState, useEffect } from 'react';
import nextDynamic from 'next/dynamic';
import { AuthProvider } from '@/context/AuthContext';
import { useSecurity } from '@/hooks/useSecurity';
import { Library, ShoppingBag } from 'lucide-react';
import LanguageSwitcher from '@/components/Common/LanguageSwitcher';

// Dynamically import client components with SSR disabled to prevent 'DOMMatrix is not defined' errors
const LibraryDashboard = nextDynamic(() => import('@/components/Library/LibraryDashboard'), { ssr: false });

function AppContent() {
  useSecurity(); // Activate global security blockers

  return (
    <main className="min-h-screen bg-black text-white selection:bg-gold-energy/30">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10">
          <div className="flex gap-4">
            <a
              href="/marketplace.html"
              className="flex items-center gap-2 px-6 py-3 font-bold transition-all text-white/50 hover:text-white/80"
            >
              <ShoppingBag className="w-5 h-5" />
              Marketplace
            </a>
            <div
              className="flex items-center gap-2 px-6 py-3 font-bold transition-all text-gold-energy border-b-2 border-gold-energy"
            >
              <Library className="w-5 h-5" />
              My Library
            </div>
          </div>
          <div className="pb-3 pr-4">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Content - Just the Library Dashboard */}
        <LibraryDashboard />
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
