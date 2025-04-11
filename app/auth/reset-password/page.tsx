"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/auth-context";
import { Logo } from "../../../components/ui/logo";
import { useScrollDirection } from "../../hooks/useScrollDirection";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const isScrollingUp = useScrollDirection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await resetPassword(email);
      setIsSuccess(true);
      setEmail("");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className={`fixed w-full transition-transform duration-300 ${
        isScrollingUp ? "translate-y-0" : "-translate-y-full"
      } top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-2xl">Arthur AI</span>
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Back to Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Reset Password Form */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground">Enter your email to receive a password reset link</p>
          </div>

          <div className="border border-border/40 rounded-lg p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {isSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm flex items-start">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-blue-500 mr-2 shrink-0 mt-0.5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>
                    A password reset link has been sent to your email.
                    Please check your inbox and spam folder.
                  </span>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>

          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link href="/auth/signin" className="font-medium text-blue-500 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 