const stages = [
  ["01", "Push received", "00:00"],
  ["02", "Image built", "00:42"],
  ["03", "Health verified", "00:50"],
  ["04", "Traffic moved", "00:51"],
] as const;

export function DeployedSection() {
  return (
    <section aria-label="Deployment summary" className="border-y border-white/10 bg-[#17231f] text-white">
      <div className="site-shell grid lg:grid-cols-[.78fr_2.22fr]">
        <div className="flex items-center border-b border-white/12 py-6 lg:border-r lg:border-b-0 lg:pr-8">
          <div>
            <p className="eyebrow text-[#9fb7ac]">A deployment, end to end</p>
            <p className="mt-2 text-sm text-white/65">One push. Four visible stages.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stages.map(([number, label, time], index) => (
            <div key={number} className="relative border-r border-white/12 px-4 py-5 last:border-r-0 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/35">{number}</span>
                <span className="font-mono text-[10px] text-white/45">{time}</span>
              </div>
              <p className="mt-5 text-sm font-medium">{label}</p>
              {index < stages.length - 1 && <span className="absolute top-[1.7rem] right-[-3px] z-10 size-1.5 rounded-full bg-[#82d6ac]" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
