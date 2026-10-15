"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, GitBranch, Globe, Terminal } from "@phosphor-icons/react";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function AuthShell({ title, subtitle, children, footer, centered = false }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode; centered?: boolean }) {
  return (
    <div className={`portal-type auth-page${centered ? " auth-page-centered" : ""}`}>
      {!centered && <Link href="/" className="auth-brand fleet-wordmark" aria-label="Fleet home"><FleetLogo className="size-5" /> Fleet</Link>}
      {!centered && <aside className="auth-story" aria-label="About Fleet">
        <div className="auth-atmosphere" aria-hidden="true"><Image src="/images/landing/hero.webp" alt="" fill sizes="55vw" className="object-cover" /></div>
        <div className="auth-story-copy">
          <p className="marketing-kicker"><span className="accent-dot" /> Built for the next push</p>
          <h2>Less between you<br /><span>and production.</span></h2>
          <p>Connect your code. Follow the release. Give your backend a place to run.</p>
          <div className="auth-story-steps">
            <div className="auth-story-step"><GitBranch className="size-4" /><span>Connect your GitHub repository</span><span>01</span></div>
            <div className="auth-story-step"><Terminal className="size-4" /><span>Build and verify your container</span><span>02</span></div>
            <div className="auth-story-step"><Globe className="size-4" /><span>Ship to a stable production URL</span><Check className="size-3.5" /></div>
          </div>
        </div>
        <p className="auth-story-footer">Your code. Your service. One workspace.</p>
      </aside>}
      <main className="auth-form-side">
        <div className="auth-form-content">
          {centered && <Link href="/" className="fleet-wordmark mb-8" aria-label="Fleet home"><FleetLogo className="size-5" /> Fleet</Link>}
          <h1>{title}</h1>
          <p className="auth-form-description">{subtitle}</p>
          <div className="auth-form-fields">{children}</div>
          {footer ? <div className="auth-form-footer">{footer}</div> : null}
          <Link href="/" className="auth-back-link inline-flex items-center gap-2"><ArrowLeft className="size-3" /> Back to Fleet</Link>
        </div>
      </main>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, href }: { text: string; linkText: string; href: string }) {
  return <>{text}{" "}<Link href={href} className="text-foreground underline-offset-4 transition-colors hover:underline">{linkText}</Link></>;
}
