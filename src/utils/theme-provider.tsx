"use client";

import { useEffect } from 'react';
import { injectThemeColors } from './theme-injector';

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    injectThemeColors();
  }, []);

  return <>{children}</>;
}