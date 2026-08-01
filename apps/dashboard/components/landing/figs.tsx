import Image from "next/image";
import { Check, GithubLogo } from "@phosphor-icons/react/dist/ssr";

const steps = [
  ["01", "Connect", "Authorize GitHub once and choose any backend repository."],
  ["02", "Configure", "Select a branch, add environment variables, and confirm your build."],
  ["03", "Go live", "Fleet builds the container, assigns a stable URL, and starts serving traffic."],
] as const;

export function Figs() {
  return (
    <section id="path" className="bg-[#e7eadf] py-24 text-[#15201e] sm:py-32">
      <div className="site-shell">
        <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
          <div className="lg:pt-10">
            <p className="eyebrow mb-6 text-[#607069]">One path. No platform archaeology.</p>
            <h2 className="max-w-[10ch] text-4xl leading-[1.02] font-medium sm:text-6xl">Repo to running backend.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#52605a]">
              Fleet handles the deployment path that usually sends you through build settings, container docs, and infrastructure limits.
            </p>

            <div className="mt-12 border-t border-black/15">
              {steps.map(([number, title, description]) => (
                <div
                  key={number}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-black/15 py-6"
                >
                  <span className="font-mono text-xs text-[#77847d]">{number}</span>
                  <div><h3 className="text-lg font-medium">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-[#5b6962]">{description}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[32rem] overflow-hidden bg-[#0b1717] lg:min-h-[46rem]">
            <Image src="/images/landing/workflow.jpg" alt="Abstract teal light passing through textured glass" fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover opacity-85" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,13,13,.1),rgba(5,13,13,.78))]" />
            <div className="absolute inset-x-6 bottom-6 border border-white/15 bg-[#071010]/72 p-5 text-white backdrop-blur-md sm:inset-x-10 sm:bottom-10 sm:p-7">
              <div className="mb-8 flex items-center justify-between border-b border-white/12 pb-5">
                <span className="flex items-center gap-2 text-sm"><GithubLogo className="size-4" weight="fill" /> api-service / main</span>
                <span className="eyebrow flex items-center gap-2 text-[#9fd5bd]"><Check className="size-3" weight="bold" /> Live</span>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div><p className="eyebrow">Build</p><p className="mt-2 font-mono text-sm">42s</p></div>
                <div><p className="eyebrow">Runtime</p><p className="mt-2 font-mono text-sm">Docker</p></div>
                <div className="col-span-2 sm:col-span-1"><p className="eyebrow">Route</p><p className="mt-2 truncate font-mono text-sm">api.fleet.run</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
