const APPS = ["Beetle AI", "Choppr", "Leadlly"];

export function DeployedSection() {
  return (
    <section aria-label="Products deployed with Fleet" className="border-y border-black/10 bg-[#e7eadf] text-[#15201e]">
      <div className="site-shell grid gap-7 py-7 md:grid-cols-[1fr_2fr] md:items-center">
        <p className="eyebrow text-[#5f6c65]">Already moving through Fleet</p>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 md:justify-end">
          {APPS.map((name) => <span key={name} className="text-lg font-medium text-[#27332f]">{name}</span>)}
        </div>
      </div>
    </section>
  );
}
