"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface HeroVideoDialogProps {
  className?: string;
  animationStyle?: "top-in-bottom-out" | "fade-in-out";
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailAlt: string;
}

const HeroVideoDialog = ({
  className,
  animationStyle = "top-in-bottom-out",
  videoSrc,
  thumbnailSrc,
  thumbnailAlt,
}: HeroVideoDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "relative w-full aspect-video overflow-hidden rounded-lg cursor-pointer group",
            className
          )}
        >
          <Image
            src={thumbnailSrc}
            alt={thumbnailAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors duration-300">
            <div className="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-8 h-8 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-w-4xl p-0 overflow-hidden",
          animationStyle === "top-in-bottom-out" &&
            "animate-in slide-in-from-top-10 duration-300"
        )}
      >
        <div className="relative w-full aspect-video">
          <iframe
            src={videoSrc}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroVideoDialog; 