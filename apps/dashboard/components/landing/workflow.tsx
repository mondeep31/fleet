const capabilities = [
  ["01", "Build visibility", "Stream build and runtime logs without leaving the project."],
  ["02", "Environment control", "Add, edit, and protect configuration for every backend."],
  ["03", "More room to run", "Compute allocations designed for services, workers, and APIs."],
  ["04", "Stable routes", "Keep one live URL through every redeploy and route your own domain."],
] as const;

export function Workflow() {
  return (
    <section className="bg-[#0b1111] py-24 text-[#eef1e8] sm:py-32">
      <div className="site-shell">
        <div className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-2 lg:items-end">
          <div><p className="eyebrow mb-6 text-[#b8a573]">A backend platform should behave like one</p><h2 className="max-w-[12ch] text-4xl leading-[1.02] font-medium sm:text-6xl">Infrastructure without the ceremony.</h2></div>
          <p className="max-w-lg text-base leading-7 text-[#95a29b] lg:justify-self-end">Fleet removes the setup work without hiding what matters after launch. You still get the logs, configuration, deployment history, and routing controls needed to operate confidently.</p>
        </div>
        <div>
          {capabilities.map(([number, title, body]) => (
            <div key={number} className="grid gap-4 border-b border-white/10 py-7 sm:grid-cols-[5rem_1fr_1.2fr] sm:items-center">
              <span className="font-mono text-xs text-[#66756e]">{number}</span>
              <h3 className="text-xl font-medium">{title}</h3>
              <p className="text-sm leading-6 text-[#87958e]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
