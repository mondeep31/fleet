"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { MobileSidebarTrigger } from "@/components/layout/sidebar";

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
    <header className="border-b border-border bg-[#0b1111]/92 backdrop-blur-xl">
      <div className="dashboard-container flex min-h-[4.5rem] items-center gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex shrink-0 items-center md:hidden">
            <MobileSidebarTrigger />
            <div className="ml-3 h-8 w-px shrink-0 bg-border" />
          </div>
          <div className="min-w-0">
            {breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="mb-1 flex items-center gap-1 text-sm text-muted-foreground"
              >
                {breadcrumbs.map((item, index) => (
                  <span key={`${item.label}-${index}`} className="flex items-center gap-1">
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
            <h1 className="text-xl font-medium text-balance md:text-2xl">
              {title}
            </h1>
          </div>
        </div>
        {actions && <div className="ml-auto shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
