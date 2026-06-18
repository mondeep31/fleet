"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupForm) {
    setError(null);
    try {
      const data = await api.signup(values.name, values.email, values.password);
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
          : "Sign up failed. Try a different email or try again.",
      );
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Get started with your first deployment"
      footer={
        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign in"
          href="/login"
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
              src="/github-svgrepo-com.svg"
              alt=""
              aria-hidden
              className="h-4 w-4 dark:invert"
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
          <Label htmlFor="name" className="text-[var(--text-secondary)]">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Mira Okonkwo"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className="h-10"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

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
            autoComplete="new-password"
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full"
        >
          {isSubmitting ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
