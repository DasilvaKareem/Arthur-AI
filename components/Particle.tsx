"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if it's a mobile device
      setIsMobile(window.innerWidth < 768);
    };
    
    // Run once on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Determine if dark mode is active
    const isDarkMode = theme === 'dark' || resolvedTheme === 'dark';
    
    // Particle class
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      color: string = '';

      constructor() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        // Smaller particles on mobile
        this.size = isMobile 
          ? Math.random() * 2 + 0.5
          : Math.random() * 3 + 1;
        // Slower movement on mobile
        this.speedX = isMobile
          ? Math.random() * 0.4 - 0.2
          : Math.random() * 0.7 - 0.35;
        this.speedY = isMobile
          ? Math.random() * 0.4 - 0.2
          : Math.random() * 0.7 - 0.35;
        
        // Different colors based on theme with increased opacity
        // Use lower opacity on mobile
        if (isDarkMode) {
          this.color = `rgba(255, 255, 255, ${isMobile ? Math.random() * 0.3 + 0.1 : Math.random() * 0.4 + 0.1})`;
        } else {
          this.color = `rgba(60, 60, 60, ${isMobile ? Math.random() * 0.3 + 0.1 : Math.random() * 0.4 + 0.1})`;
        }
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles - Fewer on mobile
    const particleCount = isMobile ? 50 : 150;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections - different colors based on theme with increased opacity
      // Lighter stroke on mobile
      ctx.strokeStyle = isDarkMode 
        ? `rgba(255, 255, 255, ${isMobile ? 0.1 : 0.2})`
        : `rgba(60, 60, 60, ${isMobile ? 0.1 : 0.2})`;
      ctx.lineWidth = isMobile ? 0.5 : 0.7;

      // Shorter connection distance on mobile
      const connectionDistance = isMobile ? 80 : 120;
      
      // Optimize for mobile: check fewer connections
      // On mobile, only check connections for a subset of particles
      const checkEvery = isMobile ? 2 : 1;
      
      for (let i = 0; i < particles.length; i += checkEvery) {
        for (let j = i + 1; j < particles.length; j += checkEvery) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme, resolvedTheme, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none"
    />
  );
} 