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

const figs = [
  {
    label: "FIG 0.1",
    Illustration: Fig01,
    title: "Submit a URL",
    description: "Paste a link to your repository. That is all you need to start.",
  },
  {
    label: "FIG 0.2",
    Illustration: Fig02,
    title: "Fleet deploys it",
    description: "Fleet takes it from there and gets your app running.",
  },
  {
    label: "FIG 0.3",
    Illustration: Fig03,
    title: "Get your URL",
    description: "When it is ready, you get a live URL back. Open it, share it, done.",
  },
] as const;

export function Figs() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-3 sm:gap-12">
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
