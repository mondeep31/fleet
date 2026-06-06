"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";

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
    <header className="border-b border-border bg-background">
      <div className="flex min-h-14 items-center justify-between gap-4 px-6 py-3">
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
          <h1 className="text-xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
