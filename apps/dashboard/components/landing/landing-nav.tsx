"use client";

import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { FleetLogo } from "@/components/brand/fleet-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "#path", label: "How it works" },
  { href: "#features", label: "Platform" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > window.innerHeight * 0.82);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-20 transition-[height,background-color,border-color,backdrop-filter] duration-300",
        scrolled || open
          ? "h-16 border-b border-black/10 bg-[#f7f7f2]/92 backdrop-blur-xl"
          : "border-0 bg-transparent",
      )}
    >
      <div className="site-shell flex h-full items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-[#141715]">
          <FleetLogo className="size-4" />
          <span className="text-lg font-medium tracking-[-0.025em]">Fleet</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-black/55 transition-colors hover:text-black">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/login" className="text-sm text-black/60 transition-colors hover:text-black">Log in</Link>
          <Link href="/signup" className="rounded-full bg-[#151715] px-5 py-2.5 text-sm text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#2f3b36]">
            Start deploying
          </Link>
        </div>

        <button type="button" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen((value) => !value)} className="flex size-10 items-center justify-center text-[#151715] lg:hidden">
          {open ? <X className="size-5" /> : <List className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-b border-black/10 bg-[#f7f7f2] px-4 py-5 text-[#151715] lg:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block border-b border-black/8 py-4 text-base text-black/70 last:border-0">
              {link.label}
            </a>
          ))}
          <Link href="/signup" className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#151715] text-sm font-medium text-white">Start deploying</Link>
        </nav>
      )}
    </header>
  );
}
