"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-42"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[370px] rounded-xl border border-white/[0.08] bg-card p-8"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex size-11 items-center justify-center rounded-lg border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <FleetLogo className="size-5" />
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {subtitle}
          </p>
        </div>

        {children}

        {footer ? (
          <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            {footer}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <>
      {text}{" "}
      <Link
        href={href}
        className="text-[var(--text-primary)] underline-offset-4 transition-colors hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {linkText}
      </Link>
    </>
  );
}
