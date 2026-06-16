"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Warning } from "@phosphor-icons/react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type Notice = { kind: "success" | "error"; text: string };

function NoticeBar({ notice }: { notice: Notice }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        notice.kind === "success"
          ? "border-green-500/20 bg-green-500/10 text-green-400"
          : "border-red-500/20 bg-red-500/10 text-red-400",
      )}
    >
      {notice.kind === "success" ? (
        <CheckCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Warning className="mt-0.5 size-4 shrink-0" />
      )}
      {notice.text}
    </div>
  );
}

function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [notice, setNotice] = useState<Notice | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  async function onSubmit(values: ProfileForm) {
    setNotice(null);
    try {
      const updated = await api.updateUser({ name: values.name });
      updateUser({
        userId: updated.userId,
        name: updated.name,
        email: updated.email,
      });
      setNotice({ kind: "success", text: "Profile updated successfully." });
    } catch (err) {
      setNotice({
        kind: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Failed to update profile. Please try again.",
      });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-1 text-base font-semibold">Profile</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Update your display name.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-(--text-secondary)">
            Name
          </Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className="h-10"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-(--text-secondary)">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email ?? ""}
            disabled
            className="h-10 opacity-60"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed.
          </p>
        </div>

        {notice && <NoticeBar notice={notice} />}

        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SecurityCard() {
  const [notice, setNotice] = useState<Notice | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordForm) {
    setNotice(null);
    try {
      await api.updateUser({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      setNotice({ kind: "success", text: "Password changed successfully." });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message === "Unauthorized"
            ? "Current password is incorrect."
            : err.message
          : "Failed to change password. Please try again.";
      setNotice({ kind: "error", text: message });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-1 text-base font-semibold">Security</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Change your account password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="currentPassword"
            className="text-(--text-secondary)"
          >
            Current password
          </Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            className="h-10"
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-xs text-red-400">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="newPassword"
            className="text-(--text-secondary)"
          >
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            className="h-10"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-xs text-red-400">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-(--text-secondary)"
          >
            Confirm new password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            className="h-10"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {notice && <NoticeBar notice={notice} />}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Change password"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header title="Settings" />
      <div className="flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-lg space-y-6">
          <ProfileCard />
          <SecurityCard />
        </div>
      </div>
    </div>
  );
}
