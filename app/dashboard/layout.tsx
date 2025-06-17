// Example: dashboard layout
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { SideNav } from "@/components/navigation/SideNav"; // If you have this component

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <SideNav />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
