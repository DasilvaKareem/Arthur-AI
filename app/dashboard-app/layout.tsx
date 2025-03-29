import React from "react";
import { AuthProvider } from "../context/auth-context";
import SubscriptionCheck from "./subscription-check";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SubscriptionCheck>
        {children}
      </SubscriptionCheck>
    </AuthProvider>
  );
} 