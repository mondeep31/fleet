export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return "—";
  const then = new Date(date).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDuration(
  start: string | Date | undefined,
  end: string | Date | undefined,
): string {
  if (!start) return "—";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export function extractRepoDomain(repoUrl: string): string {
  try {
    const url = new URL(repoUrl);
    return url.hostname.replace("www.", "");
  } catch {
    return repoUrl;
  }
}

export function truncateId(id: string, length = 8): string {
  return id.slice(0, length);
}
