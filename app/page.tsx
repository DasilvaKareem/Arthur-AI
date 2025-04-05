"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Particles from "@/components/Particle";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function RootPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Submit using native form behavior to Brevo's endpoint
    if (formRef.current) {
      const form = formRef.current;

      // Create a hidden iframe to prevent page navigation
      const iframe = document.createElement('iframe');
      iframe.name = 'hidden_iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      form.target = 'hidden_iframe';
      form.submit();

      // Show confirmation after a short delay
      setTimeout(() => {
        setIsModalOpen(true);
        form.reset();
      }, 800);
    }
  };
  
  return (
    <div className="relative flex-col min-h-screen">
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" style={{
        background: 'linear-gradient(170deg, #5f7fc5 0%, #1a245f 10%, #0a0e2a 20%, #0a0e2a 100%)'
      }} />
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <Particles />
      {/* Navigation */}
      <header>
        <div className="relative container flex h-16 items-center justify-between">
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
      <section className="relative container flex flex-col items-center justify-center gap-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Conversational AI<br />
          <span className="text-primary">Powered by State-of-the-Art Models</span>
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

      {/* Waitlist Section */}
      <section className="relative z-10 container py-12 text-center">
        <div className="mx-auto max-w-4xl rounded-lg border border-gray-700 bg-gray-800/50 p-8 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4 text-white">Join the Waitlist</h2>
          <p className="text-gray-300 mb-6">
            Be the first to access the future of AI Storytelling. Early beta members get priority support, feedback access, and launch perks.
          </p>
          <form
            ref={formRef}
            className="flex flex-col gap-4 items-center"
            method="POST"
            action="https://sibforms.com/serve/MUIFAENYE8GnabaYfEgPei8I6O4jdoA6wH2b7D5qCgLtPP3hbI8JxV0izEiBM1vK7df0YreYY9L2DYm6IvmqYlJe3UV02nNlwURWrm74fIfmZzdQlLtknNXZD0_L693_ksz7xVgztocBMS6M4b8UPe3wS-5pi1A1JjdTxcvMsHImyivQ3zkyF8VTmj3q6YuNibqlCyidW6Z6ztiP"
            data-type="subscription"
            onSubmit={handleSubmit}
          >
            <div className="w-full max-w-md">
              <label htmlFor="EMAIL" className="text-left font-medium text-gray-300">
                Join waitlist for exclusive early access
              </label>
              <input
                type="email"
                name="EMAIL"
                id="EMAIL"
                placeholder="you@example.com"
                required
                className="w-full rounded border border-gray-700 bg-gray-900/50 px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-left text-xs text-gray-400 mt-1">
                Provide your email address to subscribe. For example: abc@xyz.com
              </p>
            </div>
            <button
              type="submit"
              className="mt-4 rounded w-[200px] bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
            >
              Subscribe
            </button>
          </form>
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
      <footer className="relative border-t border-border/40 bg-muted/20 py-6">
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
