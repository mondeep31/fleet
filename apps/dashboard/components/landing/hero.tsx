"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, GithubLogo } from "@phosphor-icons/react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "9%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <section
      ref={ref}
      className="grain relative min-h-[92svh] overflow-hidden bg-[#071010]"
    >
      <motion.div
        className="absolute inset-0 scale-[1.04]"
        style={reduceMotion ? undefined : { y: imageY }}
      >
        <Image
          src="/images/landing/hero.jpg"
          alt="A figure moving through a hazy green landscape toward warm light"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] sm:object-center"
        />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,13,12,.9)_0%,rgba(4,13,12,.58)_38%,rgba(4,13,12,.08)_70%),linear-gradient(0deg,rgba(4,12,11,.76)_0%,transparent_42%)]" />

      <motion.div
        style={reduceMotion ? undefined : { y: copyY }}
        className="site-shell relative flex min-h-[92svh] items-center pb-10 pt-24 sm:pb-12 sm:pt-28"
      >
        <div className="max-w-[36rem]">
          <p className="eyebrow mb-5 text-[#c9b77f]">Backend deployment</p>
          <h1 className="max-w-[13ch] text-[clamp(3rem,4.7vw,5.25rem)] leading-[0.95] font-medium text-[#f0f2ea]">
            Deploy backends
            <br />
            from GitHub.
          </h1>
          <div className="mt-7 flex flex-col items-start gap-7">
            <p className="w-full max-w-[32rem] text-base leading-7 text-[#c6cdc5] sm:text-lg">
              Pick a repository. Fleet builds it, runs it, and gives you a live
              URL with logs, push-to-deploy, and custom domains.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/login"
                className="group inline-flex h-12 shrink-0 items-center gap-3 bg-[#e2d29e] px-5 text-sm font-medium text-[#101512] transition-colors hover:bg-[#f1e6bf]"
              >
                <GithubLogo className="size-4" weight="fill" />
                Connect GitHub
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#path"
                className="text-sm text-white/65 transition-colors hover:text-white"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      <a
        href="#path"
        aria-label="See how Fleet works"
        className="absolute right-4 bottom-6 hidden size-11 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white sm:flex lg:right-10"
      >
        <ArrowDown className="size-4" />
      </a>
    </section>
  );
}
