"use client";

import Link from "next/link";
import { List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { FleetLogo } from "@/components/brand/fleet-logo";

const links = [
  { href: "#path", label: "How it works" },
  { href: "#features", label: "Platform" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="marketing-nav">
      <div className="site-shell flex h-16 items-center gap-12">
        <Link href="/" className="fleet-wordmark" aria-label="Fleet home">
          <FleetLogo className="size-5" /> Fleet
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {links.map((link) => <a key={link.href} href={link.href} className="nav-link">{link.label}</a>)}
        </nav>
        <div className="ml-auto hidden items-center gap-6 md:flex">
          <Link href="/login" className="nav-link">Log in</Link>
          <Link href="/signup" className="marketing-button marketing-button-small">Get started</Link>
        </div>
        <button ref={trigger} type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen(!open)} className="ml-auto flex size-10 items-center justify-center rounded-md text-muted-foreground md:hidden">
          {open ? <X className="size-5" /> : <List className="size-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-marketing-nav md:hidden">
          <div className="site-shell flex flex-col gap-1 py-4">
            {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="nav-link py-3">{link.label}</a>)}
            <Link href="/login" className="nav-link py-3">Log in</Link>
            <Link href="/signup" className="marketing-button mt-3 self-start">Get started</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
