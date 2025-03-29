import React from "react";
import { AuthPagesProvider } from "../context/auth-pages-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthPagesProvider>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
    </AuthPagesProvider>
  );
} 