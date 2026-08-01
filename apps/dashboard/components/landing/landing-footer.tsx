import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { FleetLogo } from "@/components/brand/fleet-logo";

export function LandingFooter() {
  return (
    <footer id="landing-footer" className="bg-[#08100f] text-[#eef1e8]">
      <div className="site-shell py-16 sm:py-24">
        <p className="eyebrow mb-7 text-[#bba875]">Ready when your repository is</p>
        <div className="flex flex-col gap-10 border-b border-white/12 pb-16 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[11ch] text-4xl leading-[1.02] font-medium sm:text-6xl">Connect GitHub. Ship the backend.</h2>
          <Link href="/signup" className="group inline-flex h-12 items-center gap-5 self-start border border-white/25 px-5 text-sm transition-colors hover:bg-white hover:text-[#0b1111] sm:self-auto">Start deploying <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
        </div>
        <div className="flex flex-col gap-5 pt-7 text-sm text-[#829089] sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[#dce2d9]"><FleetLogo className="size-4" /><span className="text-base font-medium">Fleet</span></Link>
          <p>Backend deployment without the platform fight.</p>
          <Link href="/login" className="transition-colors hover:text-white">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
