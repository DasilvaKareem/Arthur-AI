import React from "react";
import { AuthPagesProvider } from "../context/auth-pages-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <AuthPagesProvider>
        {children}
      </AuthPagesProvider>
    </div>
  );
} 