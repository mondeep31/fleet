"use client";

import { motion, useReducedMotion } from "framer-motion";

function ZeroDowntimeFig() {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-40 w-full max-w-[280px]"
      aria-hidden
    >
      {/* Incoming traffic */}
      <line x1="8" y1="80" x2="52" y2="80" />
      <path d="M 44 76 L 52 80 L 44 84" />

      {/* Router / Traefik node */}
      <rect x="52" y="68" width="24" height="24" rx="2" />
      <line x1="64" y1="68" x2="64" y2="56" />
      <line x1="58" y1="56" x2="70" y2="56" />

      {/* Route to new container only */}
      <line x1="76" y1="80" x2="108" y2="80" />

      {/* Old container — draining */}
      <polygon points="108,56 138,40 168,56 138,72" strokeOpacity="0.3" />
      <polygon points="138,72 168,56 168,96 138,112" strokeOpacity="0.3" />
      <polygon points="108,56 138,72 138,112 108,96" strokeOpacity="0.3" />
      <line x1="138" y1="112" x2="138" y2="128" strokeOpacity="0.3" strokeDasharray="3 3" />

      {/* New container — live */}
      <polygon points="168,56 198,40 228,56 198,72" />
      <polygon points="198,72 228,56 228,96 198,112" />
      <polygon points="168,56 198,72 198,112 168,96" />
      <line x1="228" y1="76" x2="268" y2="76" strokeDasharray="3 3" />

      {/* Swap indicator */}
      <path d="M 152 100 L 188 100" />
      <path d="M 180 96 L 188 100 L 180 104" />
      <path d="M 188 100 L 152 100" strokeOpacity="0" />
      <path d="M 160 104 L 152 100 L 160 96" />

      {/* Build pipeline label lines */}
      <line x1="198" y1="128" x2="198" y2="148" />
      <line x1="178" y1="148" x2="218" y2="148" />
      <line x1="182" y1="140" x2="198" y2="148" strokeDasharray="3 3" />
      <line x1="214" y1="140" x2="198" y2="148" strokeDasharray="3 3" />
    </svg>
  );
}

export function CicdSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="cicd"
      aria-label="CI/CD and zero-downtime deployments"
      className="mx-auto max-w-5xl px-6 py-24"
    >
      <div className="grid grid-cols-1 items-center gap-12 border-t border-white/[0.08] pt-16 sm:grid-cols-2 sm:gap-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-6 font-mono text-[10px] tracking-[0.22em] text-[var(--text-secondary)] uppercase">
            CI/CD
          </p>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Push to deploy.
            <br />
            No downtime.
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Fleet registers a GitHub webhook when you create a project. Every
            push to your tracked branch triggers a full build and deploy
            automatically — no manual redeploys, no polling.
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            The new container starts off-network while the old one still serves
            traffic. Once the build is healthy, Fleet swaps the route in one
            step — your URL never goes dark.
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.45,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex justify-center text-[var(--text-secondary)] sm:justify-end"
        >
          <ZeroDowntimeFig />
        </motion.div>
      </div>
    </section>
  );
}
