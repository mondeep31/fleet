"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { api, ApiError } from "@/lib/api";

const resetSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Code must be exactly 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = use(searchParams);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  if (!email) {
    router.replace("/forgot-password");
    return null;
  }

  async function onSubmit(values: ResetForm) {
    try {
      await api.confirmPasswordReset(email!, values.code, values.newPassword);
      router.push("/login?reset=1");
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "RESET_CODE_EXPIRED":
            toast.error("Code has expired. Request a new one.");
            break;
          case "RESET_CODE_LOCKED":
            toast.error("Too many failed attempts. Request a new code.");
            break;
          case "RESET_CODE_INVALID":
            toast.error(err.message);
            break;
          default:
            toast.error("Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <AuthShell
      title="Enter reset code"
      subtitle={`We sent a 6-digit code to ${email}`}
      footer={
        <p className="text-sm text-[var(--text-tertiary)]">
          Didn&apos;t receive a code?{" "}
          <Link
            href={`/forgot-password?email=${encodeURIComponent(email)}`}
            className="text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors"
          >
            Resend
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-[var(--text-secondary)]">
            Reset code
          </Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            autoComplete="one-time-code"
            aria-invalid={Boolean(errors.code)}
            className="h-10 font-mono tracking-widest"
            maxLength={6}
            {...register("code")}
          />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-[var(--text-secondary)]">
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            className="h-10"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-[var(--text-secondary)]"
          >
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            className="h-10"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full"
        >
          {isSubmitting ? "Resetting password…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
