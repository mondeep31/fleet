import Link from "next/link";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-white/[0.06] bg-[#1a1a18]/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[var(--text-primary)] transition-opacity hover:opacity-75"
        >
          <FleetLogo className="size-4" />
          <span className="text-sm font-medium tracking-tight">fleet</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Sign in →
        </Link>
      </div>
    </header>
  );
}
