"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard
    router.replace("/dashboard-app");
  }, [router]);

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-primary">Loading dashboard...</div>
    </div>
  );
} 