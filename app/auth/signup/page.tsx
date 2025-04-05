"use client";

import React from "react";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Registration Temporarily Disabled</h1>
        <p className="text-sm text-muted-foreground mt-2">
          New account registration is temporarily disabled. Please check back later.
        </p>
      </div>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-blue-500 hover:text-blue-600"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
} 