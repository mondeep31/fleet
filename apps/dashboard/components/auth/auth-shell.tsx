"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="portal-type grid min-h-[100dvh] bg-background text-foreground lg:grid-cols-[1.08fr_.92fr]">
      <div className="grain relative hidden min-h-[100dvh] overflow-hidden lg:block">
        <Image src="/images/auth/panel.webp" alt="Light and shadow moving across textured glass" fill priority sizes="55vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,12,.04),rgba(5,12,12,.68))]" />
        <Link href="/" className="absolute left-10 top-9 flex items-center gap-2.5 text-[#14201d]"><FleetLogo className="size-4" /><span className="text-lg font-medium">Fleet</span></Link>
        <div className="absolute inset-x-10 bottom-10 max-w-xl">
          <p className="eyebrow mb-5 text-[#cfe9da]">GitHub in. Live URL out.</p>
          <p className="max-w-lg text-4xl leading-[1.02] font-[540] tracking-[-0.04em] text-white">Deploy from GitHub. Fleet handles the rest.</p>
        </div>
      </div>

      <div className="flex min-h-[100dvh] items-center justify-center px-5 py-12 sm:px-10">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[25rem]">
          <Link href="/" className="mb-14 flex items-center gap-2.5 text-white lg:hidden"><FleetLogo className="size-4" /><span className="text-lg font-medium">Fleet</span></Link>
          <p className="eyebrow mb-4 text-[#a3a3a3]">Fleet account</p>
          <h1 className="text-3xl leading-tight font-[560] tracking-[-0.035em] text-balance text-[var(--text-primary)] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-7 border-t border-white/10 pt-6 text-sm text-[var(--text-secondary)]">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, href }: { text: string; linkText: string; href: string }) {
  return <>{text}{" "}<Link href={href} className="font-medium text-white underline-offset-4 transition-colors hover:text-[#cfcfcf] hover:underline focus-visible:underline focus-visible:outline-none">{linkText}</Link></>;
}
