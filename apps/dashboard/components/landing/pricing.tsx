import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";

const plans = [
  { name: "Free", price: "$0", note: "No card. No expiry.", ram: "256 MB RAM", cpu: "0.25 CPU core", projects: "1 project", action: "Start deploying", active: true },
  { name: "Pro", price: "$9", note: "For your next stage.", ram: "1 GB RAM", cpu: "1 CPU core", projects: "5 projects", action: "Coming soon", active: false },
  { name: "Team", price: "$29", note: "Room for your team.", ram: "4 GB RAM", cpu: "4 CPU cores", projects: "Unlimited projects", action: "Coming soon", active: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="marketing-section site-shell">
      <div className="marketing-section-heading pricing-heading"><div><p className="marketing-kicker">04 / Pricing</p><h2>Start free.<br /><span>Grow from there.</span></h2></div><p>Everything you need to launch. More room when you need it.</p></div>
      <div className="pricing-plans">
        {plans.map((plan) => <article key={plan.name} className="pricing-plan"><div className="flex items-center justify-between"><h3>{plan.name}</h3>{!plan.active && <span className="plan-coming">Coming soon</span>}</div><p className="plan-price">{plan.price}<span>/ month</span></p><p className="plan-note">{plan.note}</p><ul>{[plan.ram, plan.cpu, plan.projects].map((feature) => <li key={feature}><Check className="size-3.5" />{feature}</li>)}</ul>{plan.active ? <Link href="/signup" className="marketing-button w-full">{plan.action}<ArrowRight className="size-4" /></Link> : <span className="plan-unavailable">{plan.action}</span>}</article>)}
      </div>
      <p className="pricing-included">Included on every plan <span>GitHub deployments · Build & runtime logs · Environment variables · Custom domains</span></p>
    </section>
  );
}
