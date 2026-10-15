import { Fingerprint, Terminal } from "@phosphor-icons/react/dist/ssr";

const capabilities = [
  { icon: Terminal, title: "Runtime logs", body: "Live application output, right in your project." },
  { icon: Fingerprint, title: "Environment variables", body: "Encrypted secrets, kept with your service." },
];

export function Workflow() {
  return (
    <section className="marketing-section marketing-controls site-shell">
      <div><p className="marketing-kicker">03 / Your workspace</p><h2>Your service.<br /><span>In focus.</span></h2></div>
      <div className="capability-list">
        {capabilities.map(({ icon: Icon, title, body }) => <div key={title}><Icon className="size-4" /><div><h3>{title}</h3><p>{body}</p></div></div>)}
      </div>
    </section>
  );
}
