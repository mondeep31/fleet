import Image from "next/image";
import { PipelinePreview } from "./product-visuals";

export function Figs() {
  return (
    <section id="path" className="marketing-section site-shell">
      <div className="marketing-section-heading">
        <div><p className="marketing-kicker">01 / Deployment</p><h2>From commit<br />to production.</h2></div>
        <p>Connect a repository. Follow the build. Go live after the health check passes.</p>
      </div>
      <div className="marketing-visual"><div className="visual-atmosphere" aria-hidden="true"><Image src="/images/landing/workflow.webp" alt="" fill sizes="(max-width: 1200px) 100vw, 1120px" className="object-cover" /></div><PipelinePreview /></div>
    </section>
  );
}
