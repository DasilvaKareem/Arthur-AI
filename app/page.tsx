"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";

export default function RootPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl">Arthur AI</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link 
              href="/auth/signin" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 md:py-32 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Conversational AI<br />
          <span className="text-primary">Powered by Arthur</span>
        </h1>
        <p className="max-w-[640px] text-muted-foreground sm:text-xl">
          Experience the future of AI conversation with Arthur. Our platform provides intelligent responses
          and creative content generation using cutting-edge models.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="px-8">
              Get Started for Free
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-16">
        <div className="container space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Powerful Features
            </h2>
            <p className="max-w-[640px] mx-auto text-muted-foreground sm:text-lg">
              Arthur AI brings together the best of generative AI in a seamless experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background rounded-lg p-6 shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Conversations</h3>
              <p className="text-muted-foreground">
                Chat with an AI assistant that understands context and provides helpful, accurate responses.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-background rounded-lg p-6 shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m16 10-4 4-4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Content Generation</h3>
              <p className="text-muted-foreground">
                Generate creative content, from stories to scripts, powered by state-of-the-art models.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-background rounded-lg p-6 shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Secure and Private</h3>
              <p className="text-muted-foreground">
                Your conversations and data are protected with enterprise-grade security and authentication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 md:py-32">
        <div className="bg-primary/5 border border-border rounded-lg p-8 md:p-12 shadow-sm flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
            Ready to experience Arthur AI?
          </h2>
          <p className="max-w-[640px] text-muted-foreground sm:text-lg mb-8">
            Join thousands of users already transforming how they work with AI.
            Sign up today and start chatting in seconds.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="px-8">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold">Arthur AI</span>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link 
              href="#" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
