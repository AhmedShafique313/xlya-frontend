import type { Metadata } from "next";
import { Fjalla_One } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/utils/theme-provider";
import { Providers } from "@/redux/provider";
import { AmplifyConfigProvider } from "@/components/providers/AmplifyConfigProvider";
import { ToastProvider } from "@/components/snakbar";
import KineticGrid from "@/components/common/KineticGrid";

const fjallaOne = Fjalla_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fjalla-one",
});

export const metadata: Metadata = {
  title: "Xlya",
  description: "Smart Apps & Multi-Purpose Agents — Xlya delivers productivity apps and intelligent agents to streamline your work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fjallaOne.variable}>
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