"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AirplaneTiltIcon } from "@phosphor-icons/react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-[var(--bg-base)] px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[370px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]"
      >
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-white/10">
            <AirplaneTiltIcon className="size-6 text-white" weight="bold" />
          </div>
          <span className="text-2xl font-medium tracking-tight text-[var(--text-primary)]">
            fleet
          </span>
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

        <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          {footer}
        </div>
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
