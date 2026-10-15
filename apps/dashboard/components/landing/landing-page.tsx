import { LandingNav } from "./landing-nav";
import { Hero } from "./hero";
import { Figs } from "./figs";
import { CicdSection } from "./cicd-section";
import { Workflow } from "./workflow";
import { Pricing } from "./pricing";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="landing-type marketing-page min-h-dvh">
      <LandingNav />
      <main>
        <Hero />
        <Figs />
        <CicdSection />
        <Workflow />
        <Pricing />
      </main>
      <LandingFooter />
    </div>
  );
}
