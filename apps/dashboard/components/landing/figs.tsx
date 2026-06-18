"use client";

import { motion, useReducedMotion } from "framer-motion";

function FigLabel({ label }: { label: string }) {
  return (
    <p className="mb-8 font-mono text-[10px] tracking-[0.2em] text-[var(--text-secondary)] uppercase">
      {label}
    </p>
  );
}

function Fig01() {
  return (
    <svg
      viewBox="0 0 160 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-36 w-auto"
      aria-hidden
    >
      {/* Stacked isometric flat planes — repository layers */}
      <polygon points="80,12 120,26 80,40 40,26" />
      <polygon points="80,50 120,64 80,78 40,64" />
      <polygon points="80,88 120,102 80,116 40,102" />
      {/* Right-edge pillars */}
      <line x1="120" y1="26" x2="120" y2="64" />
      <line x1="120" y1="64" x2="120" y2="102" />
      {/* Left-edge pillars */}
      <line x1="40" y1="26" x2="40" y2="64" />
      <line x1="40" y1="64" x2="40" y2="102" />
      {/* Center connectors */}
      <line x1="80" y1="40" x2="80" y2="50" />
      <line x1="80" y1="78" x2="80" y2="88" />
    </svg>
  );
}

function Fig02() {
  return (
    <svg
      viewBox="0 0 160 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-36 w-auto"
      aria-hidden
    >
      {/* Isometric cube — Docker container / build artifact */}
      {/* Top face */}
      <polygon points="80,28 112,46 80,64 48,46" />
      {/* Right face */}
      <polygon points="80,64 112,46 112,82 80,100" />
      {/* Left face */}
      <polygon points="80,64 48,46 48,82 80,100" />
      {/* Cross on top face to suggest structure */}
      <line x1="80" y1="28" x2="80" y2="64" />
      <line x1="48" y1="46" x2="112" y2="46" />
    </svg>
  );
}

function Fig03() {
  return (
    <svg
      viewBox="0 0 160 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      className="h-36 w-auto"
      aria-hidden
    >
      {/* Varying-width horizontal lines — deployment log / history */}
      <line x1="20" y1="18" x2="135" y2="18" />
      <line x1="20" y1="30" x2="92" y2="30" />
      <line x1="20" y1="42" x2="115" y2="42" />
      <line x1="20" y1="54" x2="66" y2="54" />
      <line x1="20" y1="66" x2="122" y2="66" />
      <line x1="20" y1="78" x2="80" y2="78" />
      <line x1="20" y1="90" x2="104" y2="90" />
      <line x1="20" y1="102" x2="56" y2="102" />
      <line x1="20" y1="114" x2="88" y2="114" />
    </svg>
  );
}

function Fig04() {
  return (
    <svg
      viewBox="0 0 160 130"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-36 w-auto"
      aria-hidden
    >
      {/* Push event — branch node */}
      <circle cx="32" cy="24" r="6" />
      <line x1="32" y1="30" x2="32" y2="48" />
      <line x1="20" y1="24" x2="26" y2="24" />
      <line x1="38" y1="24" x2="48" y2="24" />

      {/* Webhook delivery */}
      <line x1="48" y1="24" x2="80" y2="24" strokeDasharray="3 3" />
      <circle cx="80" cy="24" r="4" />

      {/* Pipeline down to containers */}
      <line x1="80" y1="28" x2="80" y2="52" />

      {/* Old container — faded, being replaced */}
      <polygon points="48,72 68,62 68,92 48,102" strokeOpacity="0.35" />
      <polygon points="68,62 88,72 88,102 68,92" strokeOpacity="0.35" />

      {/* New container — live */}
      <polygon points="92,72 112,62 112,92 92,102" />
      <polygon points="112,62 132,72 132,102 112,92" />

      {/* Swap arrow */}
      <path d="M 76 82 L 88 82" />
      <path d="M 84 78 L 88 82 L 84 86" />

      {/* Traefik route — traffic line to new container only */}
      <line x1="132" y1="77" x2="148" y2="77" />
      <line x1="148" y1="77" x2="148" y2="40" />
      <line x1="112" y1="62" x2="148" y2="40" strokeDasharray="3 3" />
    </svg>
  );
}

const figs = [
  {
    label: "FIG 0.1",
    Illustration: Fig01,
    title: "Connect GitHub",
    description:
      "Link your account once. Browse and search your repos — no copying URLs.",
  },
  {
    label: "FIG 0.2",
    Illustration: Fig02,
    title: "Configure & deploy",
    description:
      "Pick a branch, confirm the Dockerfile, set env vars, and create the project.",
  },
  {
    label: "FIG 0.3",
    Illustration: Fig03,
    title: "Track & redeploy",
    description:
      "Watch build logs stream in, open your live URL, and redeploy with one click.",
  },
  {
    label: "FIG 0.4",
    Illustration: Fig04,
    title: "Push-to-deploy CI/CD",
    description:
      "Fleet registers a GitHub webhook on your repo. Every push to your branch triggers a build — no manual redeploys.",
  },
] as const;

export function Figs() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-24">
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-12">
        {figs.map(({ label, Illustration, title, description }, i) => (
          <motion.div
            key={label}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.45,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="group border-t border-white/[0.08] pt-8"
          >
            <FigLabel label={label} />
            <div className="mb-8 text-[var(--text-secondary)] transition-colors duration-300 group-hover:text-[var(--text-primary)]">
              <Illustration />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
