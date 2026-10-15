import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ProjectPreview } from "./product-visuals";

export function Hero() {
  return (
    <section className="marketing-hero">
      <div className="hero-atmosphere" aria-hidden="true">
        <Image src="/images/landing/hero.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="site-shell relative">
        <div className="hero-copy">
          <p className="marketing-kicker hero-enter"><span className="accent-dot" /> A home for your backend</p>
          <h1 className="hero-enter">Your backend.<br /><span>One push away.</span></h1>
          <p className="hero-description hero-enter">Push to GitHub. Fleet builds, checks, and runs your backend.</p>
          <div className="hero-actions hero-enter mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/signup" className="marketing-button">Start deploying <ArrowRight className="size-4" /></Link>
            <a href="#path" className="marketing-text-link">See how it works <ArrowRight className="size-3.5" /></a>
          </div>
          <p className="hero-note hero-enter mt-4 text-xs text-muted-foreground">Free to start. No credit card required.</p>
        </div>
        <div className="hero-product">
          <ProjectPreview />
        </div>
      </div>
    </section>
  );
}
