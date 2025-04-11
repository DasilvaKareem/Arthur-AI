"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Particles from "@/components/Particle";
import ConfirmationModal from "@/components/ConfirmationModal";
import HeroVideoDialog from "@/registry/magicui/hero-video-dialog";
import { Features } from "@/registry/magicui/features";
import { FAQ } from "@/registry/magicui/faq";
import { Logo } from "@/components/ui/logo";

export default function RootPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formRef.current) {
      const form = formRef.current;
      const email = form.EMAIL.value;

      try {
        console.log("Submitting email:", email);
        
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        console.log("Waitlist response:", data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to request access');
        }

        // Show success modal even if the user is already registered
        setIsModalOpen(true);
        form.reset();
      } catch (error) {
        console.error('Access request submission error:', error);
        alert('There was an error submitting your request. Please try again later.');
      }
    }
  };
  
  // CSS animation styles for gradient
  const animatedGradientStyle = {
    backgroundSize: '300% 300%',
    backgroundImage: 'linear-gradient(45deg, #1a245f, #5f7fc5, #64c5f6, #5f7fc5, #1a245f)',
    animation: 'gradient 8s ease infinite',
  };
  
  // Add the keyframes animation to the page
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative flex-col min-h-screen">
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-gradient-to-b from-[#e0e8ff] via-[#f5f7ff] to-white dark:bg-gradient-to-b dark:from-[#5f7fc5] dark:via-[#0a0e2a] dark:to-[#0a0e2a]" />
      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <Particles />
      {/* Navigation */}
      <header>
        <div className="relative container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-2xl">Arthur AI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link 
              href="/auth/signin" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link href="#request-access">
              <Button>Request Access</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20">
        <div className="container">
          <div className="mx-auto max-w-[58rem] text-center">
            <div className="flex justify-center mb-8">
              <Logo className="w-24 h-24 animate-float" />
            </div>
            <h1 className="font-bold tracking-tight text-4xl sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="bg-clip-text text-transparent" style={animatedGradientStyle}>
                Tell Beautiful Stories
                <br /> With Arthur AI
              </span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Experience the magic of AI storytelling with Arthur. Transform any text into beautifully animated videos using Studio Ghibli-inspired visuals and cutting-edge AI.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="#request-access">
                <Button size="lg" className="text-base">
                  Request Access
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base" onClick={() => setIsVideoOpen(true)}>
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Video Dialog Section */}
      <section className="relative container flex justify-center items-center py-12">
        <div className="w-full max-w-4xl">
          <HeroVideoDialog
            className="block dark:hidden"
            animationStyle="top-in-bottom-out"
            videoSrc="https://www.youtube.com/embed/fiBaijTp8eg"
            thumbnailSrc="/thumbnail.jpg"
            thumbnailAlt="Hero Video"
            isOpen={isVideoOpen}
            onOpenChange={setIsVideoOpen}
          />
          <HeroVideoDialog
            className="hidden dark:block"
            animationStyle="top-in-bottom-out"
            videoSrc="https://www.youtube.com/embed/fiBaijTp8eg"
            thumbnailSrc="/thumbnail.jpg"
            thumbnailAlt="Hero Video"
            isOpen={isVideoOpen}
            onOpenChange={setIsVideoOpen}
          />
        </div>
      </section>

      {/* Request Access Section */}
      <section id="request-access" className="relative z-10 container py-12 text-center">
        <div className="mx-auto max-w-4xl rounded-lg border dark:border-gray-700 border-gray-300 dark:bg-gray-800/50 bg-white/80 p-8 backdrop-blur-sm">
          <h2 className="text-3xl font-bold mb-4 dark:text-white text-gray-900">Request Access</h2>
          <p className="dark:text-gray-300 text-gray-700 mb-6">
            Be the first to access the future of AI Storytelling. Early beta members get priority support, feedback access, and launch perks.
          </p>
          <form
            ref={formRef}
            className="flex flex-col gap-4 items-center"
            onSubmit={handleSubmit}
          >
            <div className="w-full max-w-md">
              <label htmlFor="EMAIL" className="text-left font-medium dark:text-gray-300 text-gray-700">
                Request access for exclusive early access
              </label>
              <input
                type="email"
                name="EMAIL"
                id="EMAIL"
                placeholder="you@example.com"
                required
                className="w-full rounded dark:border-gray-700 border-gray-300 dark:bg-gray-900/50 bg-white/80 px-4 py-2 text-sm dark:text-white text-gray-900 placeholder:dark:text-gray-400 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-left text-xs dark:text-gray-400 text-gray-500 mt-1">
                Provide your email address to request access. For example: abc@xyz.com
              </p>
            </div>
            <button
              type="submit"
              className="mt-4 rounded w-[200px] bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
            >
              Request Access
            </button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

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
