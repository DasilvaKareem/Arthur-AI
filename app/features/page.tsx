"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Logo } from "../../components/ui/logo";
import { useScrollDirection } from "../hooks/useScrollDirection";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import Particles from "../../components/Particle";

export default function Page() {
  const isScrollingUp = useScrollDirection();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const features = [
    {
      title: "Text to Script",
      subtitle: "AI-Powered Scriptwriting",
      description: "Turn a simple idea into a structured film or animation script. Arthur understands your intent and formats it like a real screenplay — with characters, scenes, and dialogue.",
      gifPlaceholder: "/box33.gif"
    },
    {
      title: "Script to Storyboard",
      subtitle: "Auto Storyboard Visuals",
      description: "Arthur converts your script into a visual storyboard with frames, characters, and scene breakdowns. Perfect for planning your shot list or animatic.",
      gifPlaceholder: "/box2.gif"
    },
    {
      title: "Storyboard to Animation",
      subtitle: "One-Click Scene Generation",
      description: "Bring your scenes to life with animation generated from your storyboard. Arthur uses top AI tools to turn static visuals into cinematic sequences.",
      gifPlaceholder: "/box3.gif"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <Particles />
      <div className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none bg-gradient-to-b from-[#e0e8ff]/50 via-[#f5f7ff]/30 to-white/20 dark:bg-gradient-to-b dark:from-[#5f7fc5]/50 dark:via-[#0a0e2a]/30 dark:to-[#0a0e2a]/20" />
      
      {/* Navigation */}
      <header className={`fixed w-full transition-transform duration-300 ${
        isScrollingUp ? "translate-y-0" : "-translate-y-full"
      } top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
        <div className="relative container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-2xl">Arthur AI</span>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link 
                href="/features" 
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
            </div>
          </div>
          {/* Desktop Navigation Buttons */}
          <nav className="hidden md:flex items-center gap-6">
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
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container py-4 flex flex-col gap-4">
              <Link 
                href="/auth/signin" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-4 py-2 rounded-md hover:bg-accent block"
              >
                Sign In
              </Link>
              <Link 
                href="/features" 
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80 px-4 py-2 rounded-md hover:bg-accent block"
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-4 py-2 rounded-md hover:bg-accent block"
              >
                Pricing
              </Link>
              <div className="border-t pt-4 mt-2">
                <div className="px-4 flex justify-center">
                  <Link href="#request-access" className="w-full max-w-[200px]">
                    <Button className="w-full">Request Access</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 z-10">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
              Create stunning animations
              <br />
              in just a few clicks
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Leave complex software and tedious keyframing in the past. Say 'yes' to cloud-based animation tools that automate the process, simplify creation, and help you deliver faster.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-700/50 bg-gray-900/90 backdrop-blur-sm transition-all hover:shadow-lg flex flex-col overflow-hidden"
              >
                {/* GIF Container */}
                <div className="w-full aspect-video relative bg-gray-800/80">
                  {feature.gifPlaceholder === "/path-to-your-gif-3.gif" ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      GIF Space Reserved
                    </div>
                  ) : (
                    <Image
                      src={feature.gifPlaceholder}
                      alt={feature.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Text Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <h4 className="text-lg text-blue-400 mb-3">{feature.subtitle}</h4>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="relative py-20 z-10">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose Arthur AI?</h2>
            <p className="text-xl text-muted-foreground">
              Our platform is designed with creators in mind, making animation accessible to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="p-6 rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-2">Best Story Generation</h3>
              <p className="text-muted-foreground">Makes the best stories using RAG promoting good script writing.</p>
            </div>
            <div className="p-6 rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-2">Advanced Animation Features</h3>
              <p className="text-muted-foreground">Generate sound effects, lipsyncing, customization with videos.</p>
            </div>
            <div className="p-6 rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-2">No technical experience needed</h3>
              <p className="text-muted-foreground">Our platform is designed for creators of all skill levels. No coding or animation experience needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 z-10">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to start creating?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators who are bringing their ideas to life with Arthur AI.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/signup">
                <Button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline">View Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 