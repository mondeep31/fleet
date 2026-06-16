import { SAILBOAT_PATH } from "@fleet/brand";
import { cn } from "@/lib/utils";

export function FleetLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path d={SAILBOAT_PATH} />
    </svg>
  );
}
