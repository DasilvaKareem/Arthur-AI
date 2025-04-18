"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ContactRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the localized contact page (English by default)
    router.replace("/en/contact");
  }, [router]);

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-primary">Loading contact page...</div>
    </div>
  );
} 