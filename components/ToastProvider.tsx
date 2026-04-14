"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "16px",
          background: "#1e293b",
          color: "#f8fafc",
          fontSize: "14px",
          fontWeight: 500,
        },
        success: {
          iconTheme: { primary: "#6366f1", secondary: "#f8fafc" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#f8fafc" },
        },
      }}
    />
  );
}
