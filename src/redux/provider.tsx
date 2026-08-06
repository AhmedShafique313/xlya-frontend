// src/redux/provider.tsx
"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { AmplifyConfigProvider } from "@/components/providers/AmplifyConfigProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AmplifyConfigProvider>
      <Provider store={store}>{children}</Provider>
    </AmplifyConfigProvider>
  );
}