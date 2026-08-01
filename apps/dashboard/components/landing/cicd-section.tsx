import { ArrowUpRight, GitCommit, GlobeHemisphereWest } from "@phosphor-icons/react/dist/ssr";

const releases = [
  ["1840", "a8d109f", "Live", "12:42"],
  ["1841", "45c2a11", "Superseded", "14:06"],
  ["1842", "a83f9c2", "Live", "14:31"],
] as const;

export function CicdSection() {
  return (
    <section id="features" className="landing-grid overflow-hidden bg-[#111c31] py-24 text-white sm:py-32">
      <div className="site-shell">
        <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-6 text-[#b8c8ff]">Continuous delivery</p>
            <h2 className="max-w-[10ch] text-4xl leading-[0.98] font-medium tracking-[-0.04em] sm:text-6xl">Push code. Keep serving.</h2>
            <p className="mt-7 max-w-md text-base leading-7 text-white/58">
              Fleet builds every push in isolation. The existing release stays online until its replacement passes the health check.
            </p>
            <div className="mt-10 flex gap-10 border-t border-white/12 pt-6">
              <div><p className="font-mono text-2xl text-[#eef1e8]">0s</p><p className="mt-1 text-xs text-white/38">planned downtime</p></div>
              <div><p className="font-mono text-2xl text-[#eef1e8]">1</p><p className="mt-1 text-xs text-white/38">stable production URL</p></div>
            </div>
          </div>

          <div>
            <div className="border border-white/12 bg-[#16243d]/90">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">Release history</p>
                <p className="flex items-center gap-2 font-mono text-[10px] text-white/45"><GitCommit className="size-3.5" /> main</p>
              </div>
              <div>
                {releases.map(([release, commit, state, time], index) => (
                  <div key={release} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-6 last:border-b-0 sm:grid-cols-[5rem_1fr_1fr_auto] sm:px-7">
                    <span className="font-mono text-xs text-white/35">#{release}</span>
                    <div>
                      <p className="font-mono text-xs text-white/75">{commit}</p>
                      <p className="mt-1 text-xs text-white/30 sm:hidden">{state}</p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <span className={`size-1.5 rounded-full ${index === releases.length - 1 ? "bg-[#7ac7a5]" : "bg-white/25"}`} />
                      <span className="text-xs text-white/45">{state}</span>
                    </div>
                    <span className="font-mono text-[10px] text-white/30">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-px grid sm:grid-cols-2">
              <div className="border border-white/12 bg-[#172641] p-6 sm:border-r-0 sm:p-8">
                <ArrowUpRight className="mb-10 size-5 text-[#b8c8ff]" />
                <h3 className="text-xl font-medium tracking-[-0.02em]">Push-to-deploy</h3>
                <p className="mt-3 text-sm leading-6 text-white/48">GitHub webhooks start the build. Commit and release stay linked.</p>
              </div>
              <div className="border border-white/12 bg-[#172641] p-6 sm:p-8">
                <GlobeHemisphereWest className="mb-10 size-5 text-[#b8c8ff]" />
                <h3 className="text-xl font-medium tracking-[-0.02em]">Your domain</h3>
                <p className="mt-3 text-sm leading-6 text-white/48">Verify DNS in Fleet and keep the same route through every release.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
