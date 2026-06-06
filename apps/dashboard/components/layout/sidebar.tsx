"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Folder,
  Gear,
  SignOut,
  SquaresFour,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/projects", label: "Projects", icon: Folder },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-[var(--bg-surface)]">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-white/10">
          <SquaresFour className="size-3.5 text-white" weight="duotone" />
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
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--bg-elevated)] text-foreground"
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

        <div className="mb-3 px-3">
          <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email ?? ""}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <SignOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
