import Link from "next/link";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
          <FleetLogo className="size-3.5" />
          <span className="text-sm">fleet</span>
        </div>
        <p className="hidden text-xs text-[var(--text-secondary)] sm:block">
          Connect GitHub, deploy from your repos, and get a live URL with CI/CD,
          build logs, and zero-downtime rollouts.
        </p>
        <Link
          href="/login"
          className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          Sign in →
        </Link>
      </div>
    </footer>
  );
}
