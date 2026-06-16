"use client";

import { motion, useReducedMotion } from "framer-motion";

const APPS = [
  {
    name: "Beetle AI",
    src: "/beetle.png",
    href: "https://beetleai.dev",
  },
  {
    name: "Choppr",
    src: "/choppr.png",
    href: "https://choppr.pro",
  },
  {
    name: "Leadlly",
    src: "/leadly.png",
    href: "https://leadlly.in",
  },
] as const;

export function DeployedSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-label="Apps deployed on Fleet"
      className="mx-auto max-w-5xl px-6 py-16"
    >
      <p className="mb-10 text-center font-mono text-[10px] tracking-[0.22em] text-[var(--text-secondary)] uppercase">
        Deployed on Fleet
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {APPS.map((app, i) => (
          <motion.a
            key={app.href}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.4,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group flex flex-col items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-6 py-8 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
          >
            <img
              src={app.src}
              alt={app.name}
              className="h-8 w-auto max-w-[140px] object-contain opacity-70 transition-opacity group-hover:opacity-100 sm:h-9"
              draggable={false}
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {app.name}
            </span>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
