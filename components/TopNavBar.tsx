"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, Check, LogOut, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { themes } from "@/styles/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../app/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { User } from "firebase/auth";

const themeColors = {
  neutral: "#000000",
  red: "#EF4444",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  tangerine: "#F97316",
  emerald: "#10B981",
  amber: "#F59E0B",
} as const;

type ThemeName = keyof typeof themes;

interface ColorCircleProps {
  themeName: ThemeName;
  isSelected: boolean;
}

const ColorCircle: React.FC<ColorCircleProps> = ({ themeName, isSelected }) => (
  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-gray-700">
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: themeColors[themeName] || "#000000" }}
    />
    {isSelected && <Check className="absolute w-3 h-3 text-white mix-blend-difference" />}
  </div>
);

const TopNavBar = () => {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ThemeName>("neutral");
  const [mounted, setMounted] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    
    // Don't clear the theme from localStorage to allow it to persist
    
    const savedColorTheme = (localStorage.getItem("color-theme") ||
      "neutral") as ThemeName;
    setColorTheme(savedColorTheme);
    const currentMode = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;
    applyTheme(savedColorTheme, currentMode === "dark");
  }, [theme]);

  const applyTheme = (newColorTheme: ThemeName, isDark: boolean) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const themeVariables = isDark
      ? themes[newColorTheme]?.dark
      : themes[newColorTheme]?.light;

    if (!themeVariables) {
        console.warn(`Theme variables not found for ${newColorTheme}`);
        return;
    }

    Object.entries(themeVariables).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value as string);
    });
  };

  const handleThemeChange = (newColorTheme: ThemeName) => {
    setColorTheme(newColorTheme);
    localStorage.setItem("color-theme", newColorTheme);
    const currentMode = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;
    applyTheme(newColorTheme, currentMode === "dark");
  };

  const handleModeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(colorTheme, isDark);
  };

  if (!mounted) {
    return <nav className="text-foreground p-4 flex justify-between items-center h-[60px]"></nav>;
  }

  const getInitials = (email?: string | null) => {
    if (!email) return '??';
    const parts = email.split('@')[0].split(/[._-]/);
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <nav className="text-foreground p-4 flex justify-between items-center border-b bg-background">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-xl flex gap-2 items-center">
          <Image
            src={theme === "dark" ? "/wordmark-dark.svg" : "/wordmark.svg"}
            alt="Company Wordmark"
            width={112}
            height={20}
            priority
          />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Select theme color">
              <ColorCircle themeName={colorTheme} isSelected={false} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(themes) as ThemeName[]).map((themeName) => (
              <DropdownMenuItem
                key={themeName}
                onClick={() => handleThemeChange(themeName)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ColorCircle
                  themeName={themeName}
                  isSelected={colorTheme === themeName}
                />
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Toggle light/dark theme">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleModeChange("light")} className="cursor-pointer">
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeChange("dark")} className="cursor-pointer">
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeChange("system")} className="cursor-pointer">
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {authLoading ? (
           <div className="w-10 h-10 flex items-center justify-center">
             <Loader2 className="h-5 w-5 animate-spin" />
           </div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                 <Avatar className="h-9 w-9">
                   <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                 </Avatar>
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuItem disabled className="text-sm text-muted-foreground">
                 {user.email}
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50">
                 <LogOut className="mr-2 h-4 w-4" />
                 <span>Sign Out</span>
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default TopNavBar;
