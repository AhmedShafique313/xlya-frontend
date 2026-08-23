// src/app/dashboard/layout.tsx
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppNavbar from "@/components/common/AppNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppNavbar />
      {children}
    </ProtectedRoute>
  );
}