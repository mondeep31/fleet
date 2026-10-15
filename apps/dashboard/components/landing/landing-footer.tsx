import Link from "next/link";
import { ArrowRight, GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function LandingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="site-shell">
        <div className="footer-cta"><h2>Give your code<br /><span>a place to run.</span></h2><Link href="/signup" className="marketing-button">Get started for free <ArrowRight className="size-4" /></Link></div>
        <div className="footer-bottom"><Link href="/" className="fleet-wordmark"><FleetLogo className="size-5" />Fleet</Link><span>Built for the next push.</span><nav aria-label="Footer navigation"><a href="#path">How it works</a><a href="#pricing">Pricing</a><Link href="/login">Log in</Link></nav></div>
        <div className="footer-credit"><span>© {new Date().getFullYear()} Fleet</span><a href="https://mondeep.xyz" target="_blank" rel="noopener noreferrer">Made by mondeep <ArrowRight className="size-3" /></a><Link href="/signup" aria-label="Get started with GitHub"><GithubLogo className="size-4" /></Link></div>
      </div>
    </footer>
  );
}
