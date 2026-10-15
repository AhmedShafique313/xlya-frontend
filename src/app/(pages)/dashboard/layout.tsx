// src/app/dashboard/layout.tsx
import "@fontsource-variable/archivo";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppNavbar from "@/components/common/AppNavbar";
import { LandingThemeProvider } from "@/components/landingPage/landingTheme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <LandingThemeProvider>
        <AppNavbar />
        {children}
      </LandingThemeProvider>
    </ProtectedRoute>
  );
}
