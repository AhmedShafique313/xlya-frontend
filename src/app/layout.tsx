import type { Metadata } from "next";
import "@fontsource/fjalla-one";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/dm-sans/wght-italic.css";
import "./globals.css";
import ThemeProvider from "@/utils/theme-provider";
import { Providers } from "@/redux/provider";
import { AmplifyConfigProvider } from "@/components/providers/AmplifyConfigProvider";
import { ToastProvider } from "@/components/snakbar";
import KineticGrid from "@/components/common/KineticGrid";

export const metadata: Metadata = {
  title: "Xlya",
  description: "Smart Apps & Multi-Purpose Agents. Xlya delivers productivity apps and intelligent agents to streamline your work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black min-h-screen">
        <KineticGrid />
        <AmplifyConfigProvider>
          <ThemeProvider>
            <Providers>
              {children}
              <ToastProvider />
            </Providers>
          </ThemeProvider>
        </AmplifyConfigProvider>
      </body>
    </html>
  );
}
