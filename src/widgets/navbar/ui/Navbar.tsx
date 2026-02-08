'use client';

import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div
        className={cn(
          'mx-auto',
          'transition-all duration-500 ease-in-out',
          isScrolled
            ? 'max-w-7xl px-12 sm:px-6 py-3'
            : 'max-w-340 px-20 sm:px-8 py-5'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between',
            'transition-all duration-500 ease-in-out',
            isScrolled && [
              'rounded-2xl',
              'bg-white/20 backdrop-blur-[10px]',
              'px-4 sm:px-6 py-3.5',
              'border border-neutral-400/20',
              'ring-1 ring-black/5',
            ],
            !isScrolled && ['border border-transparent']
          )}
        >
          {/* Logo */}
          <Link href="#" className="flex items-center gap-2 sm:gap-3 group relative z-10">
            <div className="flex items-center gap-2">
              <Search className="size-5 text-primary" />
              <span className="text-lg font-bold tracking-tight">
                MetaChecker
              </span>
            </div>
          </Link>

          <Button asChild size="sm">
            <Link href="/metadata">Open Tool</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}