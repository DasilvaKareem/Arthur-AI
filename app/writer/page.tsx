"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WriterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard-app page
    router.replace("/dashboard-app");
  }, [router]);

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-primary">Loading writer...</div>
    </div>
  );
}
