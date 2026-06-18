"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "@phosphor-icons/react";

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  highlight: boolean;
  cta: { label: string; href?: string; disabled: boolean };
  specs: { label: string; value: string }[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "forever",
    highlight: false,
    cta: { label: "Get started", href: "/login", disabled: false },
    specs: [
      { label: "RAM", value: "256 MB" },
      { label: "CPU", value: "0.25 cores" },
      { label: "Projects", value: "1" },
      { label: "Build queue", value: "Standard" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    priceNote: "/ mo",
    highlight: true,
    cta: { label: "Coming soon", disabled: true },
    specs: [
      { label: "RAM", value: "1 GB" },
      { label: "CPU", value: "1 core" },
      { label: "Projects", value: "5" },
      { label: "Build queue", value: "Priority" },
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$29",
    priceNote: "/ mo",
    highlight: false,
    cta: { label: "Coming soon", disabled: true },
    specs: [
      { label: "RAM", value: "4 GB" },
      { label: "CPU", value: "4 cores" },
      { label: "Projects", value: "Unlimited" },
      { label: "Build queue", value: "Priority" },
    ],
  },
];

const FEATURES = [
  "GitHub push-to-deploy",
  "Build & runtime logs",
  "Environment variables",
  "Stable live URLs",
  "Zero-downtime redeploys",
];

export function Pricing() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="pricing"
      aria-label="Pricing"
      className="mx-auto max-w-5xl px-6 py-24"
    >
      <div className="border-t border-white/8 pt-16">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 font-mono text-[10px] tracking-[0.22em] text-(--text-secondary) uppercase"
        >
          Pricing
        </motion.p>

        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 text-2xl font-semibold tracking-tight text-(--text-primary) sm:text-3xl"
        >
          Simple, transparent pricing.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-sm text-(--text-secondary)"
        >
          Every plan includes all features. Only the compute allocation differs.
        </motion.p>

        {/* Pricing cards — compute specs only */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.42,
                delay: i * 0.09,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={
                plan.highlight
                  ? "relative flex flex-col rounded-xl border border-white/14 bg-white/4 p-6 ring-1 ring-white/14"
                  : "relative flex flex-col rounded-xl border border-white/8 bg-white/2 p-6"
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/16 bg-[#1a1a18] px-3 py-0.5 font-mono text-[9px] tracking-widest text-(--text-secondary) uppercase">
                  Popular
                </span>
              )}

              <div className="mb-5">
                <p className="mb-3 text-sm font-medium text-(--text-primary)">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-(--text-primary)">
                    {plan.price}
                  </span>
                  <span className="text-sm text-(--text-secondary)">
                    {plan.priceNote}
                  </span>
                </div>
              </div>

              <div className="mb-6 space-y-2 border-t border-white/6 pt-4">
                {plan.specs.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-(--text-secondary)">
                      {s.label}
                    </span>
                    <span className="font-mono text-xs text-(--text-primary)">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                {plan.cta.disabled ? (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-white/8 bg-white/4 py-2 text-sm text-(--text-secondary) opacity-60"
                  >
                    {plan.cta.label}
                  </button>
                ) : (
                  <Link
                    href={plan.cta.href!}
                    className="block w-full rounded-lg bg-(--text-primary) py-2 text-center text-sm font-medium text-[#1a1a18] transition-opacity hover:opacity-85"
                  >
                    {plan.cta.label}
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Shared features — applies to all plans */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border border-white/8 bg-white/2 px-6 py-5"
        >
          <p className="mb-4 font-mono text-[10px] tracking-[0.18em] text-(--text-secondary) uppercase">
            Included on every plan
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check
                  className="size-3.5 shrink-0 text-(--text-secondary)"
                  weight="bold"
                />
                <span className="text-xs text-(--text-secondary)">{feature}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
