"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function staticReveal() {
  return {
    initial: false as const,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0 },
  };
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const mo = reduceMotion ? staticReveal : fadeUp;

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "calc(100svh - 3.5rem)", paddingTop: "3.5rem" }}
    >
      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
        <motion.p
          {...mo(0)}
          className="mb-6 font-mono text-[10px] tracking-[0.22em] text-[var(--text-secondary)] uppercase"
        >
          Deploy your apps
        </motion.p>

        <motion.h1
          {...mo(0.12)}
          className="text-balance text-5xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl"
        >
          Submit a URL.
          <br />
          Get one back.
        </motion.h1>

        <motion.p
          {...mo(0.26)}
          className="mx-auto mt-6 max-w-[480px] text-balance text-base leading-relaxed text-[var(--text-secondary)]"
        >
          Paste a repository link. Fleet deploys it and gives you a live
          URL you can open and share.
        </motion.p>

        <motion.div
          {...mo(0.4)}
          className="mt-10 flex items-center justify-center gap-5"
        >
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--text-primary)] px-5 text-sm font-medium text-[#1a1a18] transition-opacity hover:opacity-85"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            How it works ↓
          </a>
        </motion.div>
      </div>
    </section>
  );
}
