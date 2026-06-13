"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { LandingNav } from "./landing-nav";
import { Hero } from "./hero";
import { Figs } from "./figs";
import { Workflow } from "./workflow";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && token) {
      router.replace("/projects");
    }
  }, [hydrated, token, router]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Figs />
        <Workflow />
      </main>
      <LandingFooter />
    </div>
  );
}
