"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Logo } from "../../components/ui/logo";
import { useScrollDirection } from "../hooks/useScrollDirection";
import { Menu, X } from "lucide-react";
import { Locale } from "../locales";
import WalletConnect from "../../components/WalletConnect";

interface LocalizedNavProps {
  locale: Locale;
  path: string;
  translations: any;
  links: {
    home: string;
    features: string;
    pricing: string;
    signin: string;
    signup: string;
    terms: string;
    privacy: string;
  };
}

export default function LocalizedNav({ locale, path, translations: t, links }: LocalizedNavProps) {
  const isScrollingUp = useScrollDirection();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={`fixed w-full transition-transform duration-300 ${
      isScrollingUp ? "translate-y-0" : "-translate-y-full"
    } top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}>
      <div className="relative container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={links.home} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-2xl">{t.common.title}</span>
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href={links.features} 
              className={`text-sm font-medium ${path === 'features' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t.common.features}
            </Link>
            <Link 
              href={links.pricing}
              className={`text-sm font-medium ${path === 'pricing' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
            >
              {t.common.pricing}
            </Link>
          </div>
        </div>
        {/* Desktop Navigation Buttons */}
        <nav className="hidden md:flex items-center gap-6">
          {/* Wallet Connect Button */}
          <div className="hidden md:block">
            <WalletConnect />
          </div>
          <Link 
            href={links.signin}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.common.signIn}
          </Link>
          <Link href="#request-access">
            <Button>{t.common.requestAccess}</Button>
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
            {/* Wallet Connect in Mobile Menu */}
            <div className="px-4">
              <WalletConnect />
            </div>
            <Link 
              href={links.signin}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-4 py-2 rounded-md hover:bg-accent block"
            >
              {t.common.signIn}
            </Link>
            <Link 
              href={links.features}
              className={`text-sm font-medium ${path === 'features' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'} px-4 py-2 rounded-md hover:bg-accent block`}
            >
              {t.common.features}
            </Link>
            <Link 
              href={links.pricing}
              className={`text-sm font-medium ${path === 'pricing' ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-foreground'} px-4 py-2 rounded-md hover:bg-accent block`}
            >
              {t.common.pricing}
            </Link>
            <div className="border-t pt-4 mt-2">
              <div className="px-4 flex justify-center">
                <Link href="#request-access" className="w-full max-w-[200px]">
                  <Button className="w-full">{t.common.requestAccess}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 