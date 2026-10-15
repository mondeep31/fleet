import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ReleasesPreview } from "./product-visuals";

export function CicdSection() {
  return (
    <section id="features" className="marketing-section site-shell">
      <div className="marketing-section-heading">
        <div><p className="marketing-kicker">02 / Continuous delivery</p><h2>Keep shipping.<br /><span>Keep serving.</span></h2></div>
        <div><p>New code goes live when it’s ready. Your service keeps its URL—and your custom domain.</p><Link href="/signup" className="marketing-text-link mt-4">Deploy your first service <ArrowRight className="size-3.5" /></Link></div>
      </div>
      <div className="marketing-visual"><div className="visual-atmosphere visual-atmosphere-green" aria-hidden="true"><Image src="/images/landing/features-cicd.webp" alt="" fill sizes="(max-width: 1200px) 100vw, 1120px" className="object-cover" /></div><ReleasesPreview /></div>
    </section>
  );
}
