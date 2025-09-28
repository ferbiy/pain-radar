import { AuthStatus } from "@/components/auth/auth-status";

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Pain Radar dashboard
          </p>
        </div>
        <AuthStatus showFullStatus />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Recent Ideas</h3>
          <p className="text-sm text-muted-foreground">
            Your latest product ideas will appear here
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Subscriptions</h3>
          <p className="text-sm text-muted-foreground">
            Manage your email subscriptions
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your preferences
          </p>
        </div>
      </div>
    </div>
  );
}
