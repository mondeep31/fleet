"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fleet:sidebar-collapsed";

/** Persists to localStorage; defaults to expanded until hydrated to avoid SSR mismatch. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, hydrated]);

  return { collapsed, toggle: () => setCollapsed((c) => !c) };
}
