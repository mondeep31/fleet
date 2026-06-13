import { LandingNav } from "./landing-nav";
import { Hero } from "./hero";
import { Figs } from "./figs";
import { Workflow } from "./workflow";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Figs />
        <Workflow />
      </main>
      <LandingFooter />
    </div>
  );
}
