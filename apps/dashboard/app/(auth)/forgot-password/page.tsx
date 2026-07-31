"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { api, ApiError } from "@/lib/api";

const forgotSchema = z.object({
  email: z.email("Enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotForm) {
    try {
      await api.requestPasswordReset(values.email);
      router.push(
        `/reset-password?email=${encodeURIComponent(values.email)}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "RESET_COOLDOWN":
            toast.error("Wait a minute before requesting another code.");
            break;
          case "USER_NOT_FOUND":
            toast.error("No account found for that email.");
            break;
          default:
            toast.error(err.message || "Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a 6-digit code to your email"
      footer={
        <AuthFooterLink
          text="Remember your password?"
          linkText="Sign in"
          href="/login"
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 w-full"
        >
          {isSubmitting ? "Sending code…" : "Send reset code"}
        </Button>
      </form>
    </AuthShell>
  );
}
