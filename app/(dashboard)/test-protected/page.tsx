import { AuthStatus } from "@/components/auth/auth-status";

export default function TestProtectedPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Protected Route Test</h1>
          <p className="text-muted-foreground">
            This page should only be accessible to authenticated users
          </p>
        </div>
        <AuthStatus showFullStatus />
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold mb-2 text-green-800">✅ Success!</h3>
          <p className="text-sm text-green-700">
            You are successfully authenticated and can access this protected
            route.
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Route Protection Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ Middleware-level protection</li>
            <li>✅ Automatic redirect to login</li>
            <li>✅ Redirect back after login</li>
            <li>✅ Loading states during auth checks</li>
            <li>✅ Client-side route protection</li>
          </ul>
        </div>

        <div className="rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Test Instructions</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Sign out using the user menu</li>
            <li>Try to access this page directly</li>
            <li>You should be redirected to login</li>
            <li>After login, you should return here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
