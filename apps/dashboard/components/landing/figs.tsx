import Image from "next/image";
import {
  Check,
  GithubLogo,
  GlobeHemisphereWest,
} from "@phosphor-icons/react/dist/ssr";

const steps = [
  {
    number: "01",
    title: "Connect",
    body: "Authorize GitHub once, choose the repository and branch, then add the environment your service needs.",
  },
  {
    number: "02",
    title: "Build",
    body: "Fleet detects the Dockerfile, streams every build step, and checks the container before release.",
  },
  {
    number: "03",
    title: "Go live",
    body: "Traffic moves only after the health check passes. Your stable URL remains unchanged on the next push.",
  },
] as const;

export function Figs() {
  return (
    <section id="path" className="bg-white py-24 text-[#171918] sm:py-32">
      <div className="site-shell">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_.6fr] lg:items-end">
          <div>
            <p className="eyebrow mb-5 text-[#52615a]">How Fleet works</p>
            <h2 className="max-w-[13ch] text-4xl leading-[0.95] font-[540] tracking-[-0.05em] sm:text-6xl [font-variation-settings:'opsz'_60,'wdth'_96]">
              Three steps. Nothing hiding between them.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-[#686e6b] lg:justify-self-end">
            The interface stays close to the deployment: repository in, verified
            release out.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <article>
            <div className="relative min-h-[30rem] overflow-hidden rounded-[1.6rem] bg-[#123c4a] sm:min-h-[35rem]">
              <Image
                src="/images/landing/workflow.webp"
                alt="Blue abstract texture behind the repository connection flow"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[#082834]/25" />
              <div className="absolute left-1/2 top-12 w-[76%] -translate-x-1/2 rounded-full border border-white/30 bg-white/18 px-5 py-3 text-white backdrop-blur-xl">
                <p className="flex items-center gap-2 text-sm">
                  <GithubLogo className="size-4" weight="fill" /> GitHub
                  connected
                </p>
              </div>
              <span className="absolute left-1/2 top-[5.55rem] h-24 -translate-x-1/2 border-l border-dashed border-white/70" />
              <div className="absolute left-1/2 top-44 w-[82%] -translate-x-1/2 rounded-2xl bg-white p-5 text-[#171918] shadow-2xl">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-black/40">
                  Repository
                </p>
                <p className="mt-2 text-base font-medium">mondeep31/fleet</p>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-[#eef3f4] px-4 py-3 text-xs">
                  <span>Branch</span>
                  <span className="font-mono">main</span>
                </div>
              </div>
              <span className="absolute bottom-20 left-1/2 h-20 -translate-x-1/2 border-l border-dashed border-white/70" />
              <div className="absolute inset-x-8 bottom-8 rounded-full border border-white/30 bg-white/18 px-5 py-3 text-center text-sm text-white backdrop-blur-xl">
                Environment ready
              </div>
            </div>
            <p className="mt-6 text-2xl font-[540] tracking-[-0.03em]">
              Step 1: {steps[0].title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#6b706e]">
              {steps[0].body}
            </p>
          </article>

          <article>
            <div className="relative min-h-[30rem] overflow-hidden rounded-[1.6rem] bg-[#8d5f25] sm:min-h-[35rem]">
              <Image
                src="/images/landing/22.webp"
                alt="Amber abstract texture behind the Fleet build sequence"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover object-center saturate-125"
              />
              <div className="absolute inset-0 bg-[#4d2b14]/20" />
              <div className="absolute left-1/2 top-12 w-[78%] -translate-x-1/2 rounded-2xl bg-white p-5 text-[#171918] shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase text-black/40">
                      Building release
                    </p>
                    <p className="mt-2 text-base font-medium">commit a83f9c2</p>
                  </div>
                  <span className="size-3 animate-pulse rounded-full bg-[#ff9b36] motion-reduce:animate-none" />
                </div>
              </div>
              <span className="absolute left-1/2 top-[8.35rem] h-20 -translate-x-1/2 border-l border-dashed border-white/80" />
              <div className="absolute inset-x-8 top-52 space-y-2">
                {[
                  "Dockerfile detected",
                  "Image created",
                  "Port 3000 responding",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-full border border-white/25 bg-[#302116]/55 px-5 py-3 text-sm text-white backdrop-blur-xl"
                  >
                    <span>{item}</span>
                    <span className="font-mono text-[10px] text-white/60">
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-8 bottom-8 rounded-2xl bg-[#fff0d5] p-4 text-[#563715] shadow-xl">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Check className="size-4" weight="bold" /> Build completed in
                  42s
                </p>
              </div>
            </div>
            <p className="mt-6 text-2xl font-[540] tracking-[-0.03em]">
              Step 2: {steps[1].title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#6b706e]">
              {steps[1].body}
            </p>
          </article>

          <article>
            <div className="relative min-h-[30rem] overflow-hidden rounded-[1.6rem] bg-[#173d32] sm:min-h-[35rem]">
              <Image
                src="/images/landing/features-cicd.webp"
                alt="Green light behind the live release routing diagram"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover object-center saturate-125"
              />
              <div className="absolute inset-0 bg-[#062e24]/30" />
              <div className="absolute left-8 top-10 rounded-full border border-white/30 bg-white/18 px-5 py-3 text-sm text-white backdrop-blur-xl">
                GitHub push
              </div>
              <div className="absolute right-8 top-28 rounded-full border border-white/30 bg-white/18 px-5 py-3 text-sm text-white backdrop-blur-xl">
                Custom domain
              </div>
              <span className="absolute left-[28%] top-[5.9rem] h-32 rotate-[-22deg] border-l border-dashed border-white/70" />
              <span className="absolute right-[30%] top-[10.3rem] h-24 rotate-[25deg] border-l border-dashed border-white/70" />
              <div className="absolute left-1/2 top-56 w-[80%] -translate-x-1/2 rounded-2xl bg-white p-5 text-[#171918] shadow-2xl">
                <p className="flex items-center gap-3 text-base font-medium">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#24864f] text-white">
                    <Check className="size-5" weight="bold" />
                  </span>{" "}
                  Production is healthy
                </p>
                <p className="mt-2 pl-11 text-sm text-black/45">
                  Verified before traffic moved
                </p>
              </div>
              <span className="absolute bottom-[6.6rem] left-1/2 h-20 -translate-x-1/2 border-l border-dashed border-white/70" />
              <div className="absolute inset-x-8 bottom-8 flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/18 px-5 py-3 text-sm text-white backdrop-blur-xl">
                <GlobeHemisphereWest className="size-4" /> api.fleet.run
              </div>
            </div>
            <p className="mt-6 text-2xl font-[540] tracking-[-0.03em]">
              Step 3: {steps[2].title}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#6b706e]">
              {steps[2].body}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
