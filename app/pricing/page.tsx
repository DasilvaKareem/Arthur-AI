"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Check, X } from "lucide-react";
import { Logo } from "../../components/ui/logo";
import { useScrollDirection } from "../hooks/useScrollDirection";
import Particles from "../../components/Particle";

export default function Page() {
  const isScrollingUp = useScrollDirection();

  const plans = [
    {
      name: "Free",
      description: "Perfect for individuals just getting started",
      price: 0,
      features: [
        { name: "3 stories per month", included: true },
        { name: "Limited (3 per month)", included: true, label: "Video Generations" },
        { name: "Limited (no custom scenes)", included: true, label: "Image Generations" },
        { name: "Script Editor Access", included: true },
        { name: "Community support", included: true },
        { name: "Dialogue / Script Voiceover", included: false },
        { name: "Narration (Text-to-Speech)", included: false },
        { name: "Sound Effects & Music", included: false },
        { name: "Lip Sync Animation", included: false },
        { name: "Storyboard Export", included: false },
        { name: "Project Privacy", included: false },
      ],
      cta: {
        text: "Get Started",
        href: "/auth/signup",
      },
    },
    {
      name: "Creator Plan",
      description: "For content creators and small businesses",
      price: 49,
      features: [
        { name: "30 stories per month", included: true },
        { name: "60/month", included: true, label: "Video Generations" },
        { name: "Full Access", included: true, label: "Image Generations" },
        { name: "Script Editor Access", included: true },
        { name: "Email support", included: true },
        { name: "Dialogue / Script Voiceover", included: true },
        { name: "Narration (Text-to-Speech)", included: true },
        { name: "Sound Effects & Music", included: true },
        { name: "Lip Sync Animation", included: true },
        { name: "Storyboard Export", included: true },
        { name: "Project Privacy", included: true },
      ],
      cta: {
        text: "Start Free Trial",
        href: "/auth/signup",
      },
      highlight: true,
    },
    {
      name: "Pro Plan",
      description: "For professional creators and growing teams",
      price: 199,
      features: [
        { name: "Unlimited stories", included: true },
        { name: "Unlimited", included: true, label: "Video Generations" },
        { name: "Unlimited", included: true, label: "Image Generations" },
        { name: "Script Editor Access", included: true },
        { name: "Direct line to team", included: true },
        { name: "Dialogue / Script Voiceover + Premium voices", included: true },
        { name: "Narration (Text-to-Speech)", included: true },
        { name: "Sound Effects & Music", included: true },
        { name: "Lip Sync Animation + Emotion Sync", included: true },
        { name: "Storyboard Export + High-Res PDF", included: true },
        { name: "Project Privacy", included: true },
      ],
      cta: {
        text: "Start Free Trial",
        href: "/auth/signup",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <Particles />
      <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-gradient-to-b from-[#e0e8ff]/50 via-[#f5f7ff]/30 to-white/20 dark:bg-gradient-to-b dark:from-[#5f7fc5]/50 dark:via-[#0a0e2a]/30 dark:to-[#0a0e2a]/20" />
      
      {/* Navigation */}
      <header className={`fixed w-full transition-transform duration-300 ${
        isScrollingUp ? "translate-y-0" : "-translate-y-full"
      } top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-2xl">Arthur AI</span>
            </Link>
            <Link 
              href="/features" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Pricing
            </Link>
          </div>
          <nav className="flex items-center gap-6">
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

      {/* Pricing Section */}
      <section className="relative pt-32 pb-20 z-10">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-300 dark:to-blue-500 bg-clip-text text-transparent">
              Unlock unlimited creativity with Arthur AI
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose the perfect plan for your storytelling needs.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-8 ${
                  plan.highlight
                    ? "relative border-blue-500 dark:border-blue-400 shadow-lg"
                    : "border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 dark:bg-blue-400 text-white text-sm font-medium px-3 py-1 rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2 dark:text-white">{plan.name}</h3>
                  <p className="text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={feature.included ? "dark:text-gray-200" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Link href={plan.cta.href} className="block">
                  <Button
                    className={`w-full ${plan.highlight ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' : ''}`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta.text}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Solution Section */}
      <section className="relative py-16 z-10">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border p-8">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Need a custom solution?</h2>
            <p className="text-muted-foreground mb-6">
              Our enterprise plan can be tailored to your specific requirements. Get in touch with our sales team to discuss your needs.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contact">
                <Button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
                  Contact Sales
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline">Book a Demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 z-10">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Have questions about our pricing?{" "}
            <Link href="/faq" className="text-blue-500 dark:text-blue-400 hover:underline">
              Check our FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-blue-500 dark:text-blue-400 hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
} 