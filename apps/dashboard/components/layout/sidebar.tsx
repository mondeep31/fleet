"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretDown,
  CaretLineLeft,
  CaretLineRight,
  CaretRight,
  Folder,
  Gear,
  Plugs,
  SignOut,
  Sidebar as SidebarIcon,
  X,
} from "@phosphor-icons/react";
import { cn, isActivePath } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { FleetLogo } from "@/components/brand/fleet-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/projects", label: "Projects", icon: Folder },
  { href: "/connections", label: "Connections", icon: Plugs },
];

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
        <div className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] rounded-lg border border-border bg-[#111] p-1 shadow-[0_18px_48px_-24px_rgba(0,0,0,.8)]">
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
        className="flex w-full items-center gap-3 rounded-md border border-border bg-[#0d0d0d] px-3 py-2.5 text-left transition-colors hover:bg-[#171717]"
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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] h-[100dvh] overflow-hidden md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          "absolute inset-0 z-0 bg-black/75 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-10 flex h-[100dvh] w-[min(20rem,calc(100vw-3rem))] flex-col overflow-y-auto border-r border-border bg-background px-4 py-4 shadow-[28px_0_70px_-34px_rgba(0,0,0,.95)] transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2">
          <Link
            href="/projects"
            onClick={() => onOpenChange(false)}
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex size-8 items-center justify-center rounded-md border border-white/12 bg-[#111] text-white">
              <FleetLogo className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">fleet</span>
          </Link>
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
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-[#1f1f1f] text-white"
                    : "text-muted-foreground hover:bg-[#111] hover:text-foreground",
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
            href="/settings"
            onClick={() => onOpenChange(false)}
            className={cn(
              "mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
              pathname.startsWith("/settings")
                ? "bg-[#1f1f1f] text-white"
                : "text-muted-foreground hover:bg-[#111] hover:text-foreground",
            )}
          >
            <Gear className="size-4" />
            Profile
            <CaretRight className="ml-auto size-4" />
          </Link>

          <Separator className="my-3" />

          <AccountMenu user={user} onSignOut={handleLogout} />
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function CollapsedNavLink({
  href,
  active,
  label,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              "flex items-center justify-center rounded-lg px-2 py-2 text-sm transition-all",
              active
                ? "bg-[#1f1f1f] text-white"
                : "text-muted-foreground hover:bg-[#111] hover:text-foreground",
            )}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { collapsed, toggle } = useSidebarCollapsed();

  function handleLogout() {
    logout();
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
        "sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200 md:flex",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-2",
            collapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <Link
            href="/projects"
            className={cn(
              "flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80",
              collapsed && "justify-center",
            )}
            title={collapsed ? "Fleet" : undefined}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/12 bg-[#111] text-white">
              <FleetLogo className="size-4" />
            </div>
            {!collapsed && (
              <span className="text-base font-medium">Fleet</span>
            )}
          </Link>
        </div>

        <Separator />

        <nav
          className={cn(
            "flex-1 space-y-1",
            collapsed ? "px-2 py-3" : "p-3",
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            if (collapsed) {
              return (
                <CollapsedNavLink
                  key={item.href}
                  href={item.href}
                  active={active}
                  label={item.label}
                  icon={Icon}
                />
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-[#1f1f1f] font-medium text-white"
                    : "text-muted-foreground hover:bg-[#111] hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={cn(collapsed ? "px-2 py-3" : "p-3")}>
          {collapsed ? (
            <CollapsedNavLink
              href="/settings"
              active={pathname.startsWith("/settings")}
              label="Profile"
              icon={Gear}
            />
          ) : (
            <Link
              href="/settings"
              className={cn(
                "mb-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                pathname.startsWith("/settings")
                  ? "bg-[#1f1f1f] font-medium text-white"
                  : "text-muted-foreground hover:bg-[#111] hover:text-foreground",
              )}
            >
              <Gear className="size-4" />
              Profile
            </Link>
          )}

          <Separator className="my-3" />

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Sign out"
                    className="flex w-full items-center justify-center rounded-md border border-border bg-[#0d0d0d] py-2 text-muted-foreground transition-colors hover:bg-[#171717] hover:text-foreground"
                  />
                }
              >
                <SignOut className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          ) : (
            <AccountMenu user={user} onSignOut={handleLogout} />
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="mt-2 w-full justify-center"
          >
            {collapsed ? (
              <CaretLineRight className="size-4" />
            ) : (
              <CaretLineLeft className="size-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
