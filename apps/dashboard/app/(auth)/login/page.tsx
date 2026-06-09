"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { GithubLogo } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { api, ApiError, GITHUB_AUTH_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setError(null);
    try {
      const data = await api.login(values.email, values.password);
      setSession(data.token, {
        userId: data.userId,
        name: data.name,
        email: data.email,
      });
      router.push("/projects");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Sign in failed. Check your credentials and try again.",
      );
    }
  }

  return (
    <AuthShell
      title="Login to fleet"
      subtitle="Sign in to continue to your dashboard"
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign up"
          href="/signup"
        />
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[var(--text-secondary)]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="h-10"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[var(--text-secondary)]">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className="h-10"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="h-10 w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>

        <div className="flex items-center gap-3 py-1 text-xs text-[var(--text-muted)]">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <a
          href={GITHUB_AUTH_URL}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-[var(--bg-elevated)] px-3 text-sm font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:border-white/20 hover:bg-[#3a3a37] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <GithubLogo className="size-4" weight="fill" />
          Continue with GitHub
        </a>
      </form>
    </AuthShell>
  );
}
