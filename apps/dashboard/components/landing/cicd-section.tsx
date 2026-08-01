import Image from "next/image";
import { ArrowUpRight, GlobeHemisphereWest } from "@phosphor-icons/react/dist/ssr";

export function CicdSection() {
  return (
    <section id="features" className="relative min-h-[86svh] overflow-hidden bg-[#06100f] text-white">
      <Image src="/images/landing/features-cicd.jpg" alt="Light refracting through glass in a dark room" fill sizes="100vw" className="object-cover object-[62%_center] opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,11,11,.94)_0%,rgba(4,11,11,.58)_48%,rgba(4,11,11,.08)_100%)]" />
      <div className="site-shell relative flex min-h-[86svh] items-center py-24">
        <div className="max-w-xl">
          <p className="eyebrow mb-6 text-[#d8c38e]">Stable by default</p>
          <h2 className="max-w-[11ch] text-4xl leading-[1.02] font-medium sm:text-6xl">Push changes. Keep serving.</h2>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/68">
            Every push to your tracked branch starts a fresh build. Fleet brings the new container online before traffic moves, so releases never require a dark interval.
          </p>
          <div className="mt-12 grid gap-px border-y border-white/15 bg-white/15 sm:grid-cols-2">
            <div className="bg-[#081210]/90 p-6">
              <ArrowUpRight className="mb-8 size-5 text-[#d8c38e]" />
              <h3 className="text-lg font-medium">Push-to-deploy</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">GitHub webhooks trigger the full build automatically.</p>
            </div>
            <div className="bg-[#081210]/90 p-6">
              <GlobeHemisphereWest className="mb-8 size-5 text-[#d8c38e]" />
              <h3 className="text-lg font-medium">Your domain</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">Connect a custom domain and verify DNS from Fleet.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
