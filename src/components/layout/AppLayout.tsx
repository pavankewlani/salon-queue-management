import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ThemeToggle } from '../ui/ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-charcoal text-gray-100 transition-colors duration-200">
      {showNav && <Header />}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {children}
      </main>

      {showNav && <Footer />}

      {/* Floating Theme Switcher Button for instant 1-click toggle */}
      <div className="fixed bottom-5 right-5 z-40">
        <ThemeToggle showLabel className="shadow-2xl px-3 py-2 text-xs backdrop-blur-md" />
      </div>
    </div>
  );
};
