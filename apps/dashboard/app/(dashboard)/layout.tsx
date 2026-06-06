import { AuthGuard } from "@/components/auth/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-[100dvh] bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AuthGuard>
  );
}
