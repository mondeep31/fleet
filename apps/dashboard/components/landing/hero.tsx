"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, GithubLogo } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

const pipeline = [
  ["Build", "42s"],
  ["Health check", "Passed"],
  ["Release", "Live"],
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="grain relative overflow-hidden bg-[#f7f7f2] pb-16 pt-28 text-[#151715] sm:pb-24 sm:pt-36">
      <div className="site-shell">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end"
        >
          <div>
            <p className="eyebrow mb-6 text-[#50625a]">Backend deployment, minus the detour</p>
            <h1 className="max-w-[12ch] text-[clamp(3.1rem,6.6vw,7rem)] leading-[0.86] font-[540] tracking-[-0.065em] [font-variation-settings:'opsz'_72,'wdth'_94,'ROND'_10]">
              From repository to running backend.
            </h1>
          </div>
          <div className="pb-1 lg:justify-self-end">
            <p className="max-w-md text-base leading-7 text-[#5f6662] sm:text-lg sm:leading-8">
              Fleet builds your container, verifies the release, and gives it a stable URL. Push again whenever you are ready.
            </p>
            <div className="mt-7 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link href="/login" className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#171a18] px-5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5">
                <GithubLogo className="size-4" weight="fill" />
                Connect GitHub
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#path" className="group inline-flex items-center gap-2 text-sm text-black/55 hover:text-black">
                See the three steps <ArrowDown className="size-3.5 transition-transform group-hover:translate-y-1" />
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14 min-h-[31rem] overflow-hidden rounded-[1.75rem] bg-[#193d36] sm:min-h-[39rem]"
        >
          <Image src="/images/landing/hero.webp" alt="Abstract light and movement behind a Fleet deployment interface" fill priority sizes="(max-width: 1400px) 100vw, 86rem" className="object-cover object-center saturate-[1.15]" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(10,33,28,.55),rgba(18,42,36,.05)_55%,rgba(16,29,26,.32))]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.13)_1px,transparent_1px)] [background-size:6rem_6rem]" />

          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/18 px-4 py-2 text-xs text-white backdrop-blur-xl sm:left-8 sm:top-8">
            <GithubLogo className="size-4" weight="fill" /> fleet-api / main
          </div>
          <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/18 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white backdrop-blur-xl sm:right-8 sm:top-8">
            <span className="size-2 rounded-full bg-[#82f0b7]" /> Deploying
          </div>

          <div className="absolute inset-x-4 bottom-5 mx-auto max-w-4xl rounded-[1.4rem] bg-white/94 p-4 text-[#161917] shadow-[0_30px_80px_rgba(6,20,17,.3)] backdrop-blur-xl sm:inset-x-8 sm:bottom-8 sm:p-6">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/40">Deployment 1842</p>
                <p className="mt-1.5 text-sm font-medium">Production release</p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-[#dff5e8] px-3 py-1.5 text-xs font-medium text-[#185a37]"><Check className="size-3.5" weight="bold" /> Healthy</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3">
              {pipeline.map(([label, value], index) => (
                <div key={label} className="flex items-center justify-between border-b border-black/10 py-4 last:border-b-0 sm:block sm:border-r sm:border-b-0 sm:px-5 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
                  <div className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-full bg-[#1b6545] font-mono text-[9px] text-white">{index + 1}</span><p className="text-xs text-black/50">{label}</p></div>
                  <p className="font-mono text-xs text-black/80 sm:mt-5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
