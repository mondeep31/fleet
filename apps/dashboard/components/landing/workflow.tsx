const capabilities = [
  ["01", "Build output", "Watch every build step as it happens, from dependency install to image creation.", "streamed"],
  ["02", "Runtime logs", "Inspect live application output without reaching for a separate logging service.", "live"],
  ["03", "Configuration", "Keep environment variables and deployment settings with the service they belong to.", "encrypted"],
  ["04", "Stable routing", "Preserve one production URL across releases, then attach your own domain.", "automatic"],
] as const;

export function Workflow() {
  return (
    <section className="bg-[#dce6df] py-24 text-[#171918] sm:py-32">
      <div className="site-shell">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="eyebrow mb-6 text-[#627069]">After launch</p>
            <h2 className="max-w-[9ch] text-4xl leading-[0.98] font-medium tracking-[-0.04em] sm:text-6xl">The controls you actually need.</h2>
          </div>
          <div className="border-t border-black/18">
            {capabilities.map(([number, title, body, state]) => (
              <div key={number} className="group grid gap-4 border-b border-black/18 py-7 sm:grid-cols-[3.5rem_.8fr_1.35fr_auto] sm:items-center">
                <span className="font-mono text-[10px] text-[#718078]">{number}</span>
                <h3 className="text-lg font-medium tracking-[-0.015em]">{title}</h3>
                <p className="max-w-md text-sm leading-6 text-[#58665f]">{body}</p>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-[#75817b] sm:block">{state}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
