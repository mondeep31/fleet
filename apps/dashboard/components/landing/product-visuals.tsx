import {
  ArrowUpRight, Check, CheckCircle, Code, Folder, Gear,
  GitBranch, GitCommit, GithubLogo, Globe, Plugs, Terminal,
} from "@phosphor-icons/react/dist/ssr";
import { FleetLogo } from "@/components/brand/fleet-logo";

const logLines = [
  ["00:00", "Cloning repository from GitHub"],
  ["00:02", "Dockerfile detected"],
  ["00:04", "Installing dependencies"],
  ["00:31", "Building production image"],
  ["00:42", "Image built successfully"],
  ["00:46", "Starting container on port 3000"],
  ["00:50", "Health check passed"],
  ["00:51", "Deployment is live"],
];

export function BuildOutput({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`preview-terminal ${compact ? "preview-terminal-compact" : ""}`}>
      <div className="preview-panel-header"><span className="flex items-center gap-2"><Terminal className="size-3.5" /> Build output</span><span className="preview-muted">fleet-api</span></div>
      <div className="preview-log-lines">
        {logLines.map(([time, message], index) => (
          <div key={time} className={index > 5 ? "log-success" : ""}>
            <span>{time}</span><code>{message}</code>{index > 5 && <Check className="size-3 shrink-0" />}
          </div>
        ))}
        <p className="preview-cursor"><span aria-hidden="true">›</span> Ready for the next push<span className="cursor-block" aria-hidden="true" /></p>
      </div>
    </div>
  );
}

export function ProjectPreview() {
  return (
    <figure className="project-preview" aria-label="Example Fleet project overview with a successful deployment and build output">
      <figcaption className="sr-only">An example of the Fleet deployment interface.</figcaption>
      <div className="preview-sidebar">
        <div className="preview-brand"><FleetLogo className="size-4" /> Fleet</div>
        <div className="preview-workspace">Personal workspace</div>
        <div className="preview-sidebar-link selected"><Folder className="size-3.5" /> Projects <span>3</span></div>
        <div className="preview-sidebar-link"><Plugs className="size-3.5" /> Connections</div>
        <div className="preview-sidebar-bottom"><Gear className="size-3.5" /> Settings</div>
      </div>
      <div className="preview-main">
        <div className="preview-breadcrumb">Projects <span>/</span> <strong>fleet-api</strong><span className="ml-auto flex items-center gap-1.5"><GitBranch className="size-3" /> main</span></div>
        <div className="preview-project-heading"><div><div className="flex items-center gap-3"><span className="preview-project-icon"><Code className="size-5" /></span><h2>fleet-api</h2></div><p><GithubLogo className="size-3.5" /> mondeep31 / fleet-api</p></div><span className="preview-visit">Visit <ArrowUpRight className="size-3" /></span></div>
        <div className="preview-tabs"><span className="active">Overview</span><span>Deployments</span><span>Environment</span><span>Domains</span></div>
        <div className="preview-overview">
          <div className="preview-release">
            <div className="flex items-center justify-between gap-4"><span className="preview-label">Latest deployment</span><span className="preview-live"><span /> Live</span></div>
            <h3>Update API routes</h3>
            <p className="preview-commit"><GitCommit className="size-3.5" /> a83f9c2 <span>on</span> <GitBranch className="size-3" /> main</p>
            <div className="preview-release-details"><span>Environment<strong>Production</strong></span><span>Duration<strong>51 seconds</strong></span></div>
            <div className="preview-url"><Globe className="size-3.5" /><span>fleet-api.fleet.run</span><ArrowUpRight className="ml-auto size-3.5" /></div>
            <div className="preview-health"><CheckCircle className="size-3.5" weight="fill" /> Health check passed <span>Port 3000</span></div>
          </div>
          <BuildOutput compact />
        </div>
      </div>
    </figure>
  );
}

export function PipelinePreview() {
  const stages = [
    ["GitHub", "Push to main", GithubLogo],
    ["Build", "Dockerfile detected", Code],
    ["Verify", "Health check passed", CheckCircle],
    ["Release", "Traffic moved", Globe],
  ] as const;
  return (
    <figure className="pipeline-preview" aria-label="Example pipeline: push to GitHub, build, health check, and release">
      <figcaption className="sr-only">The stages of an example deployment, alongside its build output.</figcaption>
      <div className="pipeline-track">
        <div className="pipeline-track-label"><GitBranch className="size-3.5" /> main <span>Production pipeline</span></div>
        {stages.map(([title, detail, Icon], index) => (
          <div key={title} className="pipeline-stage">
            <div className="pipeline-stage-icon"><Icon className="size-5" /></div>
            <div><h3>{title}</h3><p>{detail}</p></div>
            <span className="pipeline-stage-status"><Check className="size-3" /> <span>0{index + 1}</span></span>
          </div>
        ))}
      </div>
      <div className="pipeline-terminal"><BuildOutput /></div>
    </figure>
  );
}

export function ReleasesPreview() {
  return (
    <figure className="releases-preview" aria-label="Example release history and custom domain configuration">
      <figcaption className="sr-only">Example releases stay linked to their Git commits and serve from one production domain.</figcaption>
      <div className="release-history">
        <div className="preview-panel-header"><span>Deployments</span><span className="flex items-center gap-1.5"><GitBranch className="size-3" /> main</span></div>
        {[
          ["Update API routes", "a83f9c2", "Live", "Just now"],
          ["Add health check endpoint", "45c2a11", "Superseded", "2h ago"],
          ["Configure production build", "a8d109f", "Superseded", "Yesterday"],
          ["Initial deployment", "e71d043", "Superseded", "2 days ago"],
        ].map(([message, commit, state, time]) => (
          <div className="release-history-row" key={commit}>
            <span className={`release-dot ${state === "Live" ? "is-live" : ""}`} />
            <div><h3>{message}</h3><p><GitCommit className="size-3" /> {commit} <span>· {time}</span></p></div>
            <span className={state === "Live" ? "preview-live" : "preview-muted"}>{state}</span>
          </div>
        ))}
      </div>
      <div className="domain-preview">
        <div className="preview-panel-header"><span className="flex items-center gap-2"><Globe className="size-3.5" /> Custom domains</span><CheckCircle className="size-3.5 text-[var(--brand-accent)]" /></div>
        <div className="domain-preview-body"><span className="preview-label">Production domain</span><p>api.your-company.com <ArrowUpRight className="size-4" /></p><div className="preview-url"><span>CNAME</span><code>fleet-api.fleet.run</code></div><div className="preview-health"><Check className="size-3.5" /> DNS verified</div></div>
      </div>
    </figure>
  );
}
