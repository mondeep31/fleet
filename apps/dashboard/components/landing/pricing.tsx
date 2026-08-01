import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";

const plans = [
  { name: "Free", price: "$0", note: "forever", ram: "256 MB", cpu: "0.25 core", projects: "1", action: "Deploy free", active: true },
  { name: "Pro", price: "$9", note: "per month", ram: "1 GB", cpu: "1 core", projects: "5", action: "Coming soon", active: false },
  { name: "Team", price: "$29", note: "per month", ram: "4 GB", cpu: "4 cores", projects: "Unlimited", action: "Coming soon", active: false },
] as const;

export function Pricing() {
  return (
    <section id="pricing" className="bg-[#f5f0e7] py-24 text-[#171918] sm:py-32">
      <div className="site-shell">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="eyebrow mb-6 text-[#65736c]">Pricing</p>
            <h2 className="max-w-[8ch] text-4xl leading-[0.98] font-medium tracking-[-0.04em] sm:text-6xl">Start free. Scale when the service does.</h2>
            <p className="mt-7 max-w-sm text-sm leading-6 text-[#5d6a64]">GitHub deployment, logs, environment variables, stable URLs, CI/CD, and custom domains are included on every plan.</p>
          </div>
          <div className="border-t border-black/20 lg:mt-2">
            {plans.map((plan) => (
              <div key={plan.name} className="grid gap-5 border-b border-black/20 py-8 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                <div><p className="text-xl font-medium tracking-[-0.02em]">{plan.name}</p><p className="mt-1.5 font-mono text-[10px] text-[#67746e]">{plan.ram} RAM · {plan.cpu} · {plan.projects} {plan.projects === "1" ? "PROJECT" : "PROJECTS"}</p></div>
                <div className="flex items-baseline gap-2"><span className="text-3xl font-medium">{plan.price}</span><span className="text-sm text-[#67746e]">{plan.note}</span></div>
                {plan.active ? <Link href="/signup" className="group inline-flex h-11 items-center justify-between gap-6 bg-[#14201d] px-5 text-sm text-white transition-transform hover:-translate-y-0.5 sm:justify-center"><span>{plan.action}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link> : <span className="eyebrow text-[#77837d]">{plan.action}</span>}
              </div>
            ))}
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              {["No credit card", "Custom domains", "Zero-downtime rollouts"].map((item) => <span key={item} className="flex items-center gap-2 text-sm text-[#53615a]"><Check className="size-3.5" weight="bold" />{item}</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
