"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FleetLogo } from "@/components/brand/fleet-logo";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("landing-footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-white/[0.06] bg-[#1a1a18]/80 backdrop-blur-sm transition-[opacity,transform] duration-300",
        footerInView && "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[var(--text-primary)] transition-opacity hover:opacity-75"
        >
          <FleetLogo className="size-4" />
          <span className="text-sm font-medium tracking-tight">fleet</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <a
            href="#features"
            className="text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
          >
            Pricing
          </a>
        </nav>

        <Link
          href="/login"
          className="text-sm text-(--text-secondary) transition-colors hover:text-(--text-primary)"
        >
          Log in →
        </Link>
      </div>
    </header>
  );
}
