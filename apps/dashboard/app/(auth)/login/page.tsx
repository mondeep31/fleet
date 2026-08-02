"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  const { reset, error: oauthError } = use(searchParams);
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (reset === "1") toast.success("Password updated. Sign in with your new password.");
    if (oauthError) {
      toast.error(
        "GitHub sign-in is temporarily unavailable. Please sign in with your email and password.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LoginForm) {
    try {
      const data = await api.login(values.email, values.password);
      setSession(data.token, {
        userId: data.userId,
        name: data.name,
        email: data.email,
      });
      router.push("/projects");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Sign in failed. Check your credentials and try again.",
      );
    }
  }

  return (
    <AuthShell
      title="Log in to Fleet"
      subtitle="Sign in to continue to your dashboard"
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign up"
          href="/signup"
        />
      }
    >
      <div className="space-y-4">
        <a href="/api/auth/github/login" className="block">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-2"
          >
            <img
              src="/images/integrations/github.svg"
              alt=""
              aria-hidden
              className="h-4 w-4 invert"
            />
            Continue with GitHub
          </Button>
        </a>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-[var(--text-tertiary)]">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[var(--text-secondary)]">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--text-tertiary)] underline underline-offset-4 hover:text-[var(--text-secondary)] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
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

        <Button type="submit" disabled={isSubmitting} className="h-10 w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
