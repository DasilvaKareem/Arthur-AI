"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const services = [
  {
    name: "Google Drive",
    icon: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
  },
  {
    name: "Dropbox",
    icon: "https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg",
  },
  {
    name: "WhatsApp",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
  },
  {
    name: "Slack",
    icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  },
  {
    name: "Discord",
    icon: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
  },
];

export default function AnimatedBeamMultipleOutputDemo({
  className,
}: {
  className?: string;
}) {
  const [activeService, setActiveService] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [beams, setBeams] = useState<
    Array<{ x: number; y: number; rotation: number }>
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextService = Math.floor(Math.random() * services.length);
      setActiveService(nextService);

      if (containerRef.current) {
        const container = containerRef.current;
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        const serviceIcon = container.querySelector(
          `[data-service="${nextService}"]`
        );

        if (serviceIcon) {
          const rect = serviceIcon.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const iconCenterX = rect.left - containerRect.left + rect.width / 2;
          const iconCenterY = rect.top - containerRect.top + rect.height / 2;

          const angle = Math.atan2(
            iconCenterY - centerY,
            iconCenterX - centerX
          );
          const rotation = (angle * 180) / Math.PI;

          setBeams((prev) => [
            ...prev.slice(-4),
            { x: iconCenterX, y: iconCenterY, rotation },
          ]);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full select-none", className)}
    >
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/10">
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
      </div>

      {services.map((service, index) => {
        const angle = (index * 2 * Math.PI) / services.length;
        const radius = 120;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={service.name}
            data-service={index}
            className={cn(
              "absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background p-2 shadow-sm transition-colors",
              activeService === index
                ? "border-foreground/20 bg-foreground/10"
                : "border-border"
            )}
            style={{
              x,
              y,
            }}
            initial={false}
            animate={{
              scale: activeService === index ? 1.1 : 1,
            }}
          >
            <img
              src={service.icon}
              alt={service.name}
              className="h-full w-full rounded object-cover"
            />
          </motion.div>
        );
      })}

      {beams.map((beam, index) => (
        <motion.div
          key={index}
          className="absolute left-1/2 top-1/2 h-px w-24 origin-left bg-gradient-to-r from-foreground/20 to-transparent"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            rotate: beam.rotation,
          }}
        />
      ))}
    </div>
  );
} 