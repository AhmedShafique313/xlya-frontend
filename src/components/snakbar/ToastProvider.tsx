"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          fontSize: "0.82rem",
          backdropFilter: "blur(12px)",
        },
        success: {
          iconTheme: {
            primary: "#c9a84c",
            secondary: "#1a1a1a",
          },
          style: {
            borderLeft: "3px solid #c9a84c",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#1a1a1a",
          },
          style: {
            borderLeft: "3px solid #ef4444",
          },
        },
      }}
    />
  );
}
