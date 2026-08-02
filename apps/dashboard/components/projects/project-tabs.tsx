"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, isActivePath } from "@/lib/utils";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${projectId}`, label: "Deployments", exact: true },
    { href: `/projects/${projectId}/domains`, label: "Domains", exact: false },
    {
      href: `/projects/${projectId}/environment-variables`,
      label: "Environment Variables",
      exact: false,
    },
  ];

  return (
    <nav className="border-b border-border bg-background">
      <div className="dashboard-container flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          // "Deployments" is the bare project URL, which is a prefix of every
          // other tab's URL — it can only be active on an exact match.
          const active = tab.exact
            ? pathname === tab.href
            : isActivePath(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 border-b-2 px-0 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-white text-white"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
