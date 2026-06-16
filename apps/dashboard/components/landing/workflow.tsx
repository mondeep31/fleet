"use client";

import { motion, useReducedMotion } from "framer-motion";

const steps = [
  { number: "01", label: "Connect GitHub and pick a repository" },
  { number: "02", label: "Choose a branch and configure env vars" },
  { number: "03", label: "Fleet clones, builds, and runs your container" },
  { number: "04", label: "Open your live URL — redeploy anytime" },
] as const;

export function Workflow() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 font-mono text-[10px] tracking-[0.22em] text-[var(--text-secondary)] uppercase"
      >
        How it works
      </motion.p>

      <div className="divide-y divide-white/[0.07]">
        {steps.map(({ number, label }, i) => (
          <motion.div
            key={number}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.38,
              delay: i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-baseline gap-8 py-5"
          >
            <span className="w-6 shrink-0 font-mono text-[11px] text-[var(--text-secondary)]">
              {number}
            </span>
            <span className="text-base text-[var(--text-primary)]">{label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
