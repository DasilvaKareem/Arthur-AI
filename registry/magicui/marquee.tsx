"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface MarqueeProps {
  className?: string;
  pauseOnHover?: boolean;
  reverse?: boolean;
  children?: React.ReactNode;
}

export function Marquee({
  className,
  pauseOnHover = false,
  reverse = false,
  children,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex gap-4 overflow-hidden [--duration:40s] [--gap:1rem]",
        className
      )}
    >
      <div
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-[--gap] [--play-state:running] [animation:scroll_var(--duration)_linear_infinite]",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[--play-state:paused]"
        )}
      >
        {children}
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex min-w-full shrink-0 items-center justify-around gap-[--gap] [--play-state:running] [animation:scroll_var(--duration)_linear_infinite]",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[--play-state:paused]"
        )}
      >
        {children}
        {children}
      </div>

      <style>
        {`
          @keyframes scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(calc(-100% - var(--gap)));
            }
          }
        `}
      </style>
    </div>
  );
} 