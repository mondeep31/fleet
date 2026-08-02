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
    <nav className="border-b border-border bg-[#f3f5f1]">
      <div className="dashboard-container flex gap-2 overflow-x-auto px-4 py-3 md:px-8">
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
                "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#d9e5dd] text-[#174c35]"
                  : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
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
