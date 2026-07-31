"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard } from "@phosphor-icons/react";
import useSWR from "swr";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

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

function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  async function onSubmit(values: ProfileForm) {
    try {
      const updated = await api.updateUser({ name: values.name });
      updateUser({
        userId: updated.userId,
        name: updated.name,
        email: updated.email,
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to update profile. Please try again.",
      );
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

const PLAN_DISPLAY: Record<
  string,
  { label: string; ram: string; cpu: string }
> = {
  free: { label: "Free", ram: "256 MB", cpu: "0.25 cores" },
  pro: { label: "Pro", ram: "1 GB", cpu: "1 core" },
  team: { label: "Team", ram: "4 GB", cpu: "4 cores" },
  unlimited: { label: "Unlimited", ram: "Unlimited", cpu: "Unlimited" },
};

function PlanCard() {
  const { data, isLoading } = useSWR("getUser", () => api.getUser());
  const planId = data?.plan ?? "free";
  const planInfo = PLAN_DISPLAY[planId] ?? PLAN_DISPLAY.free;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-1 text-base font-semibold">Plan</h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Your current subscription and resource limits.
      </p>

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-md bg-muted/40" />
      ) : (
        <div className="mb-5 rounded-md border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">{planInfo.label}</span>
            <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">RAM</p>
              <p className="font-mono text-xs">{planInfo.ram}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">CPU</p>
              <p className="font-mono text-xs">{planInfo.cpu}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <CreditCard className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Billing</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Manage your subscription and payment details.
        </p>
        <Button size="sm" variant="outline" disabled className="opacity-60">
          Upgrade — Coming soon
        </Button>
      </div>
    </div>
  );
}

function SecurityCard() {
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
    try {
      await api.updateUser({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success("Password changed successfully.");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message === "Unauthorized"
            ? "Current password is incorrect."
            : err.message
          : "Failed to change password. Please try again.";
      toast.error(message);
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
      <Header title="Profile" />
      <div className="flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-lg space-y-6">
          <ProfileCard />
          <PlanCard />
          <SecurityCard />
        </div>
      </div>
    </div>
  );
}
