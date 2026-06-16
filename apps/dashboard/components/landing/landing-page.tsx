import { LandingNav } from "./landing-nav";
import { Hero } from "./hero";
import { DeployedSection } from "./deployed-section";
import { Figs } from "./figs";
import { CicdSection } from "./cicd-section";
import { Workflow } from "./workflow";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <DeployedSection />
        <Figs />
        <CicdSection />
        <Workflow />
      </main>
      <LandingFooter />
    </div>
  );
}
