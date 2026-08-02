"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { MobileSidebarTrigger } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Header({
  title,
  breadcrumbs = [],
  actions,
}: {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[#050505]/92 backdrop-blur-xl">
      <div className="dashboard-container grid min-h-[4.25rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <div className="flex shrink-0 items-center md:hidden">
            <MobileSidebarTrigger />
            <div className="ml-3 h-8 w-px shrink-0 bg-border" />
          </div>
          <div className="min-w-0 flex-1">
            {breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="mb-0.5 flex min-w-0 items-center gap-1 overflow-hidden text-xs whitespace-nowrap text-muted-foreground sm:mb-1 sm:text-sm"
              >
                {breadcrumbs.map((item, index) => (
                  <span
                    key={`${item.label}-${index}`}
                    className={cn(
                      "min-w-0 items-center gap-1",
                      index === breadcrumbs.length - 1
                        ? "hidden sm:flex"
                        : "flex",
                    )}
                  >
                    {index > 0 && <CaretRight className="size-3" />}
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{item.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1 className="truncate text-base font-medium tracking-[-0.02em] sm:text-lg md:text-xl">
              {title}
            </h1>
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
