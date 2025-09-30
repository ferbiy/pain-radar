import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { MobileSidebar } from "@/components/navigation/mobile-sidebar";
import { UserMenu } from "@/components/navigation/user-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Mobile Header with Menu */}
          <MobileSidebar />

          {/* Page Content */}
          <main className="flex-1">
            <div className="container py-6 px-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
