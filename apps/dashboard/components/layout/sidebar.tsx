"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretDown,
  CaretRight,
  Folder,
  Gear,
  SignOut,
  Sidebar as SidebarIcon,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { FleetLogo } from "@/components/brand/fleet-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [{ href: "/projects", label: "Projects", icon: Folder }];

function AccountMenu({
  user,
  onSignOut,
}: {
  user: { name: string; email: string } | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {open && (
        <div className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] rounded-lg border border-border bg-[var(--bg-elevated)] shadow-[0_18px_48px_-24px_rgba(0,0,0,0.8)]">
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-full justify-start gap-2 bg-transparent px-3 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
            onClick={onSignOut}
          >
            <SignOut className="size-4" />
            Sign out
          </Button>
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-left transition-colors hover:bg-[#3a3a37]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email ?? ""}
          </p>
        </div>
        <CaretDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground"
      >
        <SidebarIcon className="size-5" />
      </button>

      <MobileSidebarOverlay open={open} onOpenChange={setOpen} />
    </>
  );
}

function MobileSidebarOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    onOpenChange(false);
    logout();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          "absolute inset-0 bg-black/65 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(300px,calc(100vw-4rem))] flex-col border-r border-border bg-[var(--bg-surface)] px-4 py-4 shadow-[28px_0_70px_-34px_rgba(0,0,0,0.95)] transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            <FleetLogo className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">fleet</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close navigation"
            className="ml-auto"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Separator className="-mx-4 mb-3" />

        <nav className="flex-1 space-y-1 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_12px_28px_-20px_rgba(255,255,255,0.8)]"
                    : "text-muted-foreground hover:bg-[var(--bg-elevated)] hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pb-3">
          <Link
            href="/projects"
            onClick={() => onOpenChange(false)}
            className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground"
          >
            <Gear className="size-4" />
            Settings
            <CaretRight className="ml-auto size-4" />
          </Link>

          <Separator className="my-3" />

          <AccountMenu user={user} onSignOut={handleLogout} />
        </div>
      </aside>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
  }

  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-border bg-[var(--bg-surface)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] md:flex">
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
          <FleetLogo className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">fleet</span>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_12px_28px_-20px_rgba(255,255,255,0.8)]"
                  : "text-muted-foreground hover:bg-[var(--bg-elevated)] hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Link
          href="/projects"
          className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[var(--bg-elevated)] hover:text-foreground"
        >
          <Gear className="size-4" />
          Settings
        </Link>

        <Separator className="my-3" />

        <AccountMenu user={user} onSignOut={handleLogout} />
      </div>
    </aside>
  );
}
