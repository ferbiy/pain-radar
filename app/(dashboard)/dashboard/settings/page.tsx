import { AuthStatus } from "@/components/auth/auth-status";

export default function SettingsPage() {
  return (
    <div className="mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>
        <AuthStatus showFullStatus />
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">
                Your email address is managed through authentication
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Email Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Notification Frequency
              </label>
              <p className="text-sm text-muted-foreground">
                Choose how often you want to receive idea notifications
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Topic Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Interested Categories
              </label>
              <p className="text-sm text-muted-foreground">
                Select the types of product ideas you&apos;re interested in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
